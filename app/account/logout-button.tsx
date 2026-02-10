"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button className="rounded border px-3 py-1" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
      Logout
    </button>
  );
}
