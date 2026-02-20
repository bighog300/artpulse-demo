"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { enqueueToast } from "@/lib/toast";

export function AcceptInviteButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "accepted">("idle");
  const isPending = status === "loading";

  const handleAccept = async () => {
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
  };

  return (
    <Button type="button" disabled={isPending} onClick={handleAccept}>
      {isPending ? "Accepting…" : "Accept Invite"}
    </Button>
  );
}
