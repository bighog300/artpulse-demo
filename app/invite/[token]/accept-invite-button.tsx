"use client";

import { useState } from "react";
import { enqueueToast } from "@/lib/toast";

export function AcceptInviteButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "accepted">("idle");

  return (
    <button
      type="button"
      disabled={status !== "idle"}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-70"
      onClick={async () => {
        setStatus("loading");
        try {
          const response = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
          if (response.ok) {
            setStatus("accepted");
            enqueueToast({ title: "Invite accepted" });
            return;
          }
          enqueueToast({ title: "Could not accept invite", variant: "error" });
          setStatus("idle");
        } catch {
          enqueueToast({ title: "Could not accept invite", variant: "error" });
          setStatus("idle");
        }
      }}
    >
      {status === "loading" ? "Accepting..." : status === "accepted" ? "Accepted ✓" : "Accept invite"}
    </button>
  );
}
