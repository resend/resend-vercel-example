import { VercelInviteUserEmail } from '../../../emails/vercel-invite-user';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Vercel <vercel@resend.dev>',
      to: [body.email],
      subject: 'Join team on Vercel',
      react: VercelInviteUserEmail({
        teamName: 'Enigma',
      }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
