import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import type { VenueMembershipRole } from "@prisma/client";
import { hasMinimumVenueRole } from "@/lib/ownership";
import { logWarn } from "@/lib/logging";
import { trackMetric } from "@/lib/telemetry";

export type SessionUser = { id: string; email: string; name: string | null; role: "USER" | "EDITOR" | "ADMIN" };

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
const authSecret = process.env.AUTH_SECRET;
const isProdLikeEnv = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

if (isProdLikeEnv && !authSecret) {
  throw new Error("AUTH_SECRET is required in production/preview (set AUTH_SECRET to a secure random value, e.g. `openssl rand -base64 32`).");
}

const hasAuthConfig = Boolean(authSecret && googleClientId && googleClientSecret);


const authFailureWindowMs = 60_000;
const authFailureState = { windowStart: 0, count: 0 };

function logRateLimitedAuthFailure() {
  const now = Date.now();
  if (now - authFailureState.windowStart >= authFailureWindowMs) {
    authFailureState.windowStart = now;
    authFailureState.count = 0;
  }
  authFailureState.count += 1;
  if (authFailureState.count <= 3) {
    logWarn({ message: "auth_failure", reason: "missing_session", countInWindow: authFailureState.count });
  }
  trackMetric("auth.failure", 1, { reason: "missing_session" });
}


export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: hasAuthConfig
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      await db.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: {
          name: user.name ?? undefined,
          imageUrl: user.image ?? undefined,
        },
        create: {
          email: user.email.toLowerCase(),
          name: user.name,
          imageUrl: user.image,
          role: "USER",
        },
      });
      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const dbUser = await db.user.findUnique({ where: { email: token.email.toLowerCase() } });
      if (dbUser) {
        token.sub = dbUser.id;
        token.role = dbUser.role;
        token.name = dbUser.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub || !token.email) return session;
      session.user.id = token.sub;
      session.user.email = token.email;
      session.user.name = token.name ?? null;
      session.user.role = (token.role as SessionUser["role"]) || "USER";
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: session.user.role || "USER",
  };
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    logRateLimitedAuthFailure();
    throw new Error("unauthorized");
  }
  return user;
}

export async function requireUser() {
  return requireAuth();
}

export async function isVenueMember(userId: string, venueId: string) {
  const membership = await db.venueMembership.findUnique({
    where: { userId_venueId: { userId, venueId } },
    select: { role: true },
  });
  return membership;
}

export async function requireVenueRole(venueId: string, minRole: VenueMembershipRole = "EDITOR") {
  const user = await requireAuth();
  if (hasGlobalVenueAccess(user.role)) return user;

  const membership = await isVenueMember(user.id, venueId);
  if (!membership) throw new Error("forbidden");
  if (!hasMinimumVenueRole(membership.role, minRole)) throw new Error("forbidden");

  return user;
}

export function hasGlobalVenueAccess(role: SessionUser["role"]) {
  return role === "EDITOR" || role === "ADMIN";
}

export async function requireEditor() {
  const user = await requireAuth();
  if (user.role !== "EDITOR" && user.role !== "ADMIN") throw new Error("forbidden");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("forbidden");
  return user;
}

export function assertAuthConfig() {
  return hasAuthConfig;
}
