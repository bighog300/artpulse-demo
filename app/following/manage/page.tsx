import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { PageHeader } from "@/components/ui/page-header";
import { FollowingManageClient } from "@/components/follows/following-manage-client";

export default async function FollowingManagePage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/following/manage");

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Manage follows"
        subtitle="Search, filter, and bulk manage artists and venues you follow."
        actions={<Link href="/following" className="rounded border px-3 py-1 text-sm">Back to Following</Link>}
      />
      <FollowingManageClient />
    </main>
  );
}
