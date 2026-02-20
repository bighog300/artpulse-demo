"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export function LoginButton({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  return (
    <Button type="button" onClick={() => signIn("google", { callbackUrl })}>
      Continue with Google
    </Button>
  );
}
