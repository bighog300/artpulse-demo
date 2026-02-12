import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import type { VenueMembershipRole } from "@prisma/client";
import { hasMinimumVenueRole } from "@/lib/ownership";

export type SessionUser = { id: string; email: string; name: string | null; role: "USER" | "EDITOR" | "ADMIN" };

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
const authSecret = process.env.AUTH_SECRET;

const hasAuthConfig = Boolean(authSecret && googleClientId && googleClientSecret);

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
  if (!user) throw new Error("unauthorized");
  return user;
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
  if (user.role === "EDITOR" || user.role === "ADMIN") return user;

  const membership = await isVenueMember(user.id, venueId);
  if (!membership) throw new Error("forbidden");
  if (!hasMinimumVenueRole(membership.role, minRole)) throw new Error("forbidden");

  return user;
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
