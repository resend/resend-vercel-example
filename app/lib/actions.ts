"use server";

import clientPromise from "./mongodb";
import { revalidatePath } from "next/cache";

export interface WebhookDefinition {
  _id?: string;
  slug: string;
  name: string;
  method: string;
  status: number;
  contentType: string;
  body: string;
  notifyEmail?: string;
  createdAt: string;
}

export interface WebhookRequestLog {
  _id?: string;
  webhookSlug: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
  clientIp: string;
  timestamp: string;
  emailNotified?: boolean;
  emailError?: string;
}

export type WebhookState = { error: string } | { data: WebhookDefinition };

/**
 * Creates a dynamic webhook endpoint configuration
 */
export async function createWebhook(prevState: any, formData: FormData): Promise<WebhookState> {
  const name = (formData.get("name") as string) || "My Webhook";
  let slug = (formData.get("slug") as string) || "";
  const method = (formData.get("method") as string) || "POST";
  const statusStr = (formData.get("status") as string) || "200";
  const contentType = (formData.get("contentType") as string) || "application/json";
  const body = (formData.get("body") as string) || "{\"status\": \"success\"}";
  const notifyEmail = (formData.get("notifyEmail") as string) || "";

  // Normalize slug: lowercase and hyphenated or auto-generate if empty
  if (!slug) {
    slug = Math.random().toString(36).substring(2, 8);
  } else {
    slug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  }

  const status = Number.parseInt(statusStr, 10) || 200;

  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");

    // Check if slug is already taken
    const existing = await db.collection("webhooks").findOne({ slug });
    if (existing) {
      return { error: `The endpoint path '/api/webhooks/${slug}' is already taken. Please choose a different one.` };
    }

    const newWebhook: any = {
      name,
      slug,
      method,
      status,
      contentType,
      body,
      notifyEmail: notifyEmail.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.collection("webhooks").insertOne(newWebhook);

    revalidatePath("/");
    return { data: newWebhook as WebhookDefinition };
  } catch (e: any) {
    console.error("Error creating webhook configuration", e);
    return { error: e.message || "An unexpected error occurred." };
  }
}

/**
 * Retrieves all registered dynamic webhooks
 */
export async function getWebhooks(): Promise<WebhookDefinition[]> {
  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");
    const docs = await db
      .collection("webhooks")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => ({
      _id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      method: doc.method,
      status: doc.status,
      contentType: doc.contentType,
      body: doc.body,
      notifyEmail: doc.notifyEmail,
      createdAt: doc.createdAt,
    })) as WebhookDefinition[];
  } catch (e) {
    console.error("Error fetching webhooks from MongoDB", e);
    return [];
  }
}

/**
 * Retrieves incoming request logs for a specific webhook slug
 */
export async function getWebhookLogs(slug: string): Promise<WebhookRequestLog[]> {
  if (!slug) return [];
  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");
    const docs = await db
      .collection("logs")
      .find({ webhookSlug: slug })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return docs.map((doc) => ({
      _id: doc._id.toString(),
      webhookSlug: doc.webhookSlug,
      method: doc.method,
      headers: doc.headers || {},
      query: doc.query || {},
      body: doc.body || "",
      clientIp: doc.clientIp || "",
      timestamp: doc.timestamp,
      emailNotified: doc.emailNotified,
      emailError: doc.emailError,
    })) as WebhookRequestLog[];
  } catch (e) {
    console.error("Error fetching request logs", e);
    return [];
  }
}

/**
 * Deletes a dynamic webhook and all of its associated logs
 */
export async function deleteWebhook(slug: string) {
  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");

    await Promise.all([
      db.collection("webhooks").deleteOne({ slug }),
      db.collection("logs").deleteMany({ webhookSlug: slug }),
    ]);

    revalidatePath("/");
    return { data: "Webhook and its logs deleted successfully." };
  } catch (e: any) {
    return { error: e.message || "Failed to delete webhook." };
  }
}

/**
 * Clears request logs for a specific webhook slug
 */
export async function clearWebhookLogs(slug: string) {
  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");
    await db.collection("logs").deleteMany({ webhookSlug: slug });
    revalidatePath("/");
    return { data: "Logs cleared successfully." };
  } catch (e: any) {
    return { error: e.message || "Failed to clear logs." };
  }
}

/**
 * Fetches dynamic dashboard analytics
 */
export async function getDashboardAnalytics() {
  try {
    const client = await clientPromise;
    const db = client.db("dynamic-webhook-app");

    const totalEndpoints = await db.collection("webhooks").countDocuments();
    const totalLogs = await db.collection("logs").countDocuments();

    // Calculate error (4xx, 5xx) counts from the logs
    // (In our log schema, we can store responseStatus returned during execution)
    const logs = await db.collection("logs").find({}).project({ status: 1 }).toArray();
    const statusCodes = logs.map((l) => l.status).filter(Boolean);
    const errors = statusCodes.filter((c) => c >= 400).length;
    const successes = statusCodes.filter((c) => c >= 200 && c < 300).length;

    return {
      totalEndpoints,
      totalLogs,
      errors,
      successes,
    };
  } catch (e) {
    console.error("Error running aggregations on MongoDB", e);
    return {
      totalEndpoints: 0,
      totalLogs: 0,
      errors: 0,
      successes: 0,
    };
  }
}
