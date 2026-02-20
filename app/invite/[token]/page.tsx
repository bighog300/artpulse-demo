import Link from "next/link";
import { AcceptInviteButton } from "@/app/invite/[token]/accept-invite-button";

type InvitePageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Venue invite</h1>
      <p className="mt-3 text-sm text-muted-foreground">To accept this invite, sign in with the invited email and submit acceptance.</p>
      <div className="mt-6">
        <AcceptInviteButton token={token} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Need to authenticate first? <Link href="/login" className="underline">Go to login</Link>
      </p>
    </main>
  );
}
