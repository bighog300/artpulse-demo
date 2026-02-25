"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enqueueToast } from "@/lib/toast";

export type AdminHardDeleteButtonProps = {
  entityLabel: string;
  entityId: string;
  deleteUrl: string;
  redirectTo: string;
  confirmPhrase?: string;
};

export function isHardDeleteConfirmMatch(value: string, confirmPhrase: string) {
  return value.trim() === confirmPhrase;
}

export async function requestHardDelete(deleteUrl: string, fetchImpl: typeof fetch = fetch) {
  return fetchImpl(deleteUrl, { method: "DELETE" });
}

type HardDeleteDependencies = {
  push: (href: string) => void;
  refresh: () => void;
  toast: typeof enqueueToast;
};

export function handleHardDeleteResponse({
  response,
  entityLabel,
  redirectTo,
  deps,
}: {
  response: { ok: boolean; status: number };
  entityLabel: string;
  redirectTo: string;
  deps: HardDeleteDependencies;
}) {
  if (response.ok) {
    deps.toast({ title: `${entityLabel} deleted permanently` });
    deps.push(redirectTo);
    deps.refresh();
    return { ok: true as const };
  }

  if (response.status === 401 || response.status === 403) {
    deps.toast({ title: "Not authorized", variant: "error" });
    return { ok: false as const };
  }

  if (response.status === 409) {
    deps.toast({ title: "Delete conflict", message: "This record cannot be permanently deleted right now.", variant: "error" });
    return { ok: false as const };
  }

  deps.toast({ title: "Delete failed", message: "Please try again.", variant: "error" });
  return { ok: false as const };
}

export default function AdminHardDeleteButton({
  entityLabel,
  entityId,
  deleteUrl,
  redirectTo,
  confirmPhrase = "DELETE",
}: AdminHardDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const canConfirm = isHardDeleteConfirmMatch(confirmation, confirmPhrase) && !busy;

  async function onDelete() {
    if (!canConfirm) return;
    setBusy(true);
    const res = await requestHardDelete(deleteUrl);
    setBusy(false);

    const result = handleHardDeleteResponse({
      response: { ok: res.ok, status: res.status },
      entityLabel,
      redirectTo,
      deps: {
        push: (href) => router.push(href),
        refresh: () => router.refresh(),
        toast: enqueueToast,
      },
    });

    if (result.ok) {
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete permanently
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {entityLabel} permanently?</DialogTitle>
            <DialogDescription>
              This cannot be undone. This will permanently remove the record and may remove related data.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Entity ID: {entityId}</p>
          <label className="grid gap-1 text-sm" htmlFor={`hard-delete-confirm-${entityId}`}>
            Type <span className="font-semibold">{confirmPhrase}</span> to confirm
            <input
              id={`hard-delete-confirm-${entityId}`}
              className="w-full rounded border p-2"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void onDelete()} disabled={!canConfirm}>
              {busy ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
