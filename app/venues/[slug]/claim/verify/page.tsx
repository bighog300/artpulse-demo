import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyVenueClaim } from "@/lib/venue-claims/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function VerifyVenueClaimPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string }> }) {
  noStore();
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) return <main className="p-6">Missing token.</main>;

  try {
    const result = await verifyVenueClaim({ db: db as never, slug, token });
    redirect(result.redirectTo);
  } catch {
    return <main className="p-6">This claim link is invalid or expired.</main>;
  }
}
