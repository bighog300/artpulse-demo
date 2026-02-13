"use client";

import { signIn } from "next-auth/react";

export function LoginButton({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  return (
    <button
      className="rounded bg-black px-4 py-2 text-white"
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
    >
      Continue with Google
    </button>
  );
}
