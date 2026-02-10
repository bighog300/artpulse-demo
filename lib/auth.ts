import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";

export type SessionUser = { id: string; email: string; name: string | null; role: "USER" | "EDITOR" | "ADMIN" };

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
const authSecret = process.env.AUTH_SECRET;

if (!googleClientId || !googleClientSecret || !authSecret) {
  console.warn("Missing AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET/AUTH_SECRET for NextAuth.");
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    GoogleProvider({
      clientId: googleClientId || "",
      clientSecret: googleClientSecret || "",
    }),
  ],
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
  if (!authSecret) throw new Error("AUTH_SECRET is required.");
  if (!googleClientId || !googleClientSecret) throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required.");
}
