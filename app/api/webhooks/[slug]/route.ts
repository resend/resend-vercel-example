import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { Resend } from "resend";
import WebhookTriggeredEmail from "../../../../emails/webhook-triggered";

const resendApiKey = process.env.RESEND_API_KEY || "re_mockkey_12345678";
const resend = new Resend(resendApiKey);

// A catch-all handling style for dynamic route in Next.js 16+ App Router
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const timestamp = new Date().toISOString();

  // Extract headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Extract query search params
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Extract client IP address
  const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

  // Extract payload body
  let body = "";
  try {
    body = await request.text();
  } catch (err) {
    console.warn("Failed to read body text from request:", err);
  }

  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");

    // Look up the webhook definition by slug
    const webhook = await db.collection("webhooks").findOne({ slug });
    if (!webhook) {
      return new NextResponse(
        JSON.stringify({ error: `Webhook endpoint '/api/webhooks/${slug}' not found.` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify configured HTTP Method restrictions
    const requestedMethod = request.method;
    const configuredMethod = webhook.method;
    if (configuredMethod !== "ALL" && configuredMethod !== requestedMethod) {
      return new NextResponse(
        JSON.stringify({
          error: `HTTP Method ${requestedMethod} not allowed on this endpoint. Configured method is ${configuredMethod}.`
        }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    let emailNotified = false;
    let emailError: string | undefined = undefined;

    // Send email alert via Resend if email notifications are enabled
    if (webhook.notifyEmail) {
      try {
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_mockkey_12345678") {
          console.log(`[MOCK EMAIL] Webhook ${webhook.name} was triggered. Sending email to ${webhook.notifyEmail}`);
          emailNotified = true;
        } else {
          // Format headers and body prettily for display in the email
          const prettyHeaders = JSON.stringify(headers, null, 2);
          let prettyBody = body;
          try {
            if (body) {
              prettyBody = JSON.stringify(JSON.parse(body), null, 2);
            }
          } catch {
            // keep original text body
          }

          const { error } = await resend.emails.send({
            from: "Webhooks <webhooks@resend.dev>",
            to: [webhook.notifyEmail],
            subject: `🚨 Webhook Alert: ${webhook.name} triggered!`,
            react: WebhookTriggeredEmail({
              slug,
              name: webhook.name,
              method: requestedMethod,
              clientIp,
              timestamp,
              headersJson: prettyHeaders,
              bodyJson: prettyBody,
            }),
          });

          if (error) {
            emailError = error.message;
            console.error("Resend delivery failed:", error.message);
          } else {
            emailNotified = true;
          }
        }
      } catch (err: any) {
        emailError = err.message || "Failed to send email alert";
        console.error("Resend execution error:", err);
      }
    }

    // Insert incoming request log into MongoDB
    await db.collection("logs").insertOne({
      webhookSlug: slug,
      method: requestedMethod,
      headers,
      query,
      body,
      clientIp,
      timestamp,
      status: webhook.status,
      emailNotified,
      emailError,
    });

    // Return the response configured by the developer
    return new NextResponse(webhook.body, {
      status: webhook.status,
      headers: {
        "Content-Type": webhook.contentType,
        "Access-Control-Allow-Origin": "*", // allow cross-origin triggers
      },
    });
  } catch (error: any) {
    console.error("Fatal error handling webhook execution log", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error in dynamic route.", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
