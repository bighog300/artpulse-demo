import Link from "next/link";

type InvitePageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Venue invite</h1>
      <p className="mt-3 text-sm text-zinc-600">To accept this invite, sign in with the invited email and submit acceptance.</p>
      <form className="mt-6" method="post" action={`/api/invites/${token}/accept`}>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Accept invite
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">
        Need to authenticate first? <Link href="/login" className="underline">Go to login</Link>
      </p>
    </main>
  );
}
