"use server";

import { Resend } from "resend";
import { VercelInviteUserEmail } from "../../emails/vercel-invite-user";
import clientPromise from "./mongodb";
import { revalidatePath } from "next/cache";

const resendApiKey = process.env.RESEND_API_KEY || "re_mockkey_12345678";
const resend = new Resend(resendApiKey);

export interface Invitation {
  _id?: string;
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  role: string;
  status: "Sent" | "Failed";
  errorMessage?: string;
  createdAt: string;
}

export type State = { error: string } | { data: string };

export async function sendInvitation(prevState: State, formData: FormData): Promise<State> {
  const emailInput = formData.get("email") as string;
  const invitedByUsername = (formData.get("invitedByUsername") as string) || "Alan Turing";
  const invitedByEmail = (formData.get("invitedByEmail") as string) || "alan.turing@example.com";
  const teamName = (formData.get("teamName") as string) || "Enigma";
  const role = (formData.get("role") as string) || "Member";

  if (!emailInput) {
    return { error: "Email address is required." };
  }

  // Support comma-separated emails for bulk processing (Step 3 & 4)
  const emails = emailInput
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  if (emails.length === 0) {
    return { error: "No valid email addresses provided." };
  }

  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const email of emails) {
    try {
      // If RESEND_API_KEY is not defined, mock successful delivery or fail cleanly
      let sendError: any = null;
      let sendData: any = null;

      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_mockkey_12345678") {
        console.log(`[MOCK EMAIL] Sending invite to ${email} for team ${teamName}`);
        sendData = { id: `mock-id-${Date.now()}-${Math.random()}` };
      } else {
        const { data, error } = await resend.emails.send({
          from: "Vercel <vercel@resend.dev>",
          to: [email],
          subject: `Join ${teamName} on Vercel`,
          react: VercelInviteUserEmail({
            username: email.split("@")[0],
            invitedByUsername,
            invitedByEmail,
            teamName,
            inviteLink: `https://vercel.com/teams/invite/${encodeURIComponent(teamName.toLowerCase())}`,
          }),
        });
        sendError = error;
        sendData = data;
      }

      const client = await clientPromise;
      const db = client.db("resend-vercel-example");

      if (sendError) {
        await db.collection("invitations").insertOne({
          email,
          invitedByUsername,
          invitedByEmail,
          teamName,
          role,
          status: "Failed",
          errorMessage: sendError.message,
          createdAt: new Date().toISOString(),
        });
        results.push({ email, success: false, error: sendError.message });
      } else {
        await db.collection("invitations").insertOne({
          email,
          invitedByUsername,
          invitedByEmail,
          teamName,
          role,
          status: "Sent",
          createdAt: new Date().toISOString(),
        });
        results.push({ email, success: true });
      }
    } catch (e: any) {
      console.error("Failed to process invitation for", email, e);
      try {
        const client = await clientPromise;
        const db = client.db("resend-vercel-example");
        await db.collection("invitations").insertOne({
          email,
          invitedByUsername,
          invitedByEmail,
          teamName,
          role,
          status: "Failed",
          errorMessage: e.message || "Unknown error",
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error("Could not write failure log to MongoDB", dbErr);
      }
      results.push({ email, success: false, error: e.message });
    }
  }

  revalidatePath("/");

  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount === emails.length) {
    return { error: `All ${emails.length} invitation(s) failed: ${results[0].error}` };
  } else if (failedCount > 0) {
    return { data: `Successfully sent ${emails.length - failedCount} invitation(s). ${failedCount} failed.` };
  }

  return { data: `Successfully invited ${emails.length} recipient(s) to ${teamName}!` };
}

export async function getInvitations(): Promise<Invitation[]> {
  try {
    const client = await clientPromise;
    const db = client.db("resend-vercel-example");
    const docs = await db
      .collection("invitations")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => ({
      _id: doc._id.toString(),
      email: doc.email,
      invitedByUsername: doc.invitedByUsername,
      invitedByEmail: doc.invitedByEmail,
      teamName: doc.teamName,
      role: doc.role,
      status: doc.status,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt,
    })) as Invitation[];
  } catch (e) {
    console.error("Error fetching invitations from MongoDB", e);
    return [];
  }
}

export async function getAnalytics() {
  try {
    const client = await clientPromise;
    const db = client.db("resend-vercel-example");
    const invitations = await db.collection("invitations").find({}).toArray();

    const total = invitations.length;
    const sent = invitations.filter((i) => i.status === "Sent").length;
    const failed = invitations.filter((i) => i.status === "Failed").length;

    const uniqueTeams = new Set(invitations.map((i) => i.teamName)).size;
    const uniqueInvitees = new Set(invitations.map((i) => i.email)).size;

    return {
      total,
      sent,
      failed,
      uniqueTeams,
      uniqueInvitees,
    };
  } catch (e) {
    console.error("Error running aggregations on MongoDB", e);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      uniqueTeams: 0,
      uniqueInvitees: 0,
    };
  }
}

export async function clearInvitationHistory() {
  try {
    const client = await clientPromise;
    const db = client.db("resend-vercel-example");
    await db.collection("invitations").deleteMany({});
    revalidatePath("/");
    return { data: "History cleared successfully!" };
  } catch (e: any) {
    return { error: e.message || "Failed to clear history." };
  }
}
