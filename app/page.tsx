import { VercelInviteUserEmail } from '../emails/vercel-invite-user';
import { Resend } from 'resend';

export default function Page() {
  async function send(formData: FormData) {
    'use server';

    const resend = new Resend(process.env.RESEND_API_KEY);
    const email = formData.get('email') as string;

    const { data, error } = await resend.emails.send({
      from: 'Vercel <vercel@resend.dev>',
      to: [email],
      subject: 'Join team on Vercel',
      react: VercelInviteUserEmail({}),
    });

    if (error) {
      console.log(error);
    }

    console.log(data);
  }

  return (
    <div className="bg-zinc-950 py-16 sm:py-24 h-[100vh]">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get invited to a team
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-lg leading-8 text-gray-300">
            Type your email address to get invited to a team.
          </p>
          <form className="mx-auto mt-10 flex max-w-md gap-x-4" action={send}>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="delivered@resend.dev"
              placeholder="jane@example.com"
              autoComplete="email"
              className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
            />
            <button
              type="submit"
              className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Invite
            </button>
          </form>
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2"
          >
            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
            <defs>
              <radialGradient
                r={1}
                cx={0}
                cy={0}
                id="759c1415-0410-454c-8f7c-9a820de03641"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(512 512) rotate(90) scale(512)"
              >
                <stop stopColor="#7775D6" />
                <stop offset={1} stopColor="#E935C1" stopOpacity={0} />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}