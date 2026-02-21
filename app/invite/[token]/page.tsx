import { AcceptInviteButton } from "@/app/invite/[token]/accept-invite-button";

type InvitePageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Invite</h1>
      <p className="mt-3 text-sm text-muted-foreground">Accept this invite to apply your admin-assigned role.</p>
      <div className="mt-6">
        <AcceptInviteButton token={token} />
      </div>
    </main>
  );
}
