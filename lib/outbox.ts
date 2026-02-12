import { db } from "@/lib/db";
import { sendPendingNotificationsWithDb } from "@/lib/outbox-worker";

export async function sendPendingNotifications({ limit }: { limit: number }) {
  return sendPendingNotificationsWithDb({ limit }, db);
}
