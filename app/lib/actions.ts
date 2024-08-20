"use server";

import { Resend } from "resend";
import { VercelInviteUserEmail } from "../../emails/vercel-invite-user";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function send(prevState: string | undefined, formData: FormData) {
  const email = formData.get("email") as string;

  const { data, error } = await resend.emails.send({
    from: "Vercel <vercel@resend.dev>",
    to: [email],
    subject: "Join team on Vercel",
    react: VercelInviteUserEmail({}),
  });

  if (error) {
    return error.message;
  }

  console.log(data);

  return "Email sent!";
}
