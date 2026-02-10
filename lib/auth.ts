import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

export type SessionUser = { id: string; email: string; name: string | null; role: "USER" | "EDITOR" | "ADMIN" };

const COOKIE_NAME = "artpulse_session";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function createSession(email: string) {
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, role: "USER" },
  });
  const payload = `${user.id}:${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return user;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  const [userId] = payload.split(":");
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) throw new Error("unauthorized");
  return user;
}

export async function requireEditor() {
  const user = await requireAuth();
  if (user.role !== "EDITOR" && user.role !== "ADMIN") throw new Error("forbidden");
  return user;
}
