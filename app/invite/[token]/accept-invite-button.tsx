"use client";

import { useState } from "react";
import { enqueueToast } from "@/lib/toast";

export function AcceptInviteButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-70"
      onClick={async () => {
        setLoading(true);
        const response = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
        if (response.ok) {
          enqueueToast({ title: "Invite accepted" });
          window.location.href = "/my/venues";
          return;
        }
        enqueueToast({ title: "Could not accept invite", variant: "error" });
        setLoading(false);
      }}
    >
      {loading ? "Accepting…" : "Accept invite"}
    </button>
  );
}
