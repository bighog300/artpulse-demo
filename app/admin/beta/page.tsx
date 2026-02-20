export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { AdminBetaClient } from "./admin-beta-client";

export default async function AdminBetaPage() {
  const [requests, feedback] = await Promise.all([
    db.betaAccessRequest.findMany({
      where: { status: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
      select: { id: true, email: true, note: true, createdAt: true },
    }),
    db.betaFeedback.findMany({
      take: 50,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, email: true, pagePath: true, message: true, createdAt: true },
    }),
  ]);

  return (
    <AdminBetaClient
      initialRequests={requests.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
      feedback={feedback.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
    />
  );
}
