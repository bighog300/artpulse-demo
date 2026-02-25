import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { handleHardDeleteResponse, isHardDeleteConfirmMatch, requestHardDelete } from "../app/(admin)/admin/_components/AdminHardDeleteButton";

test("renders destructive button and typed confirmation copy", () => {
  const source = readFileSync("app/(admin)/admin/_components/AdminHardDeleteButton.tsx", "utf8");
  assert.match(source, /Delete permanently/);
  assert.match(source, /Type <span className="font-semibold">\{confirmPhrase\}<\/span> to confirm/);
});

test("confirm phrase must exactly match DELETE after trim", () => {
  assert.equal(isHardDeleteConfirmMatch("DELETE", "DELETE"), true);
  assert.equal(isHardDeleteConfirmMatch(" DELETE ", "DELETE"), true);
  assert.equal(isHardDeleteConfirmMatch("delete", "DELETE"), false);
  assert.equal(isHardDeleteConfirmMatch("", "DELETE"), false);
});

test("requestHardDelete calls fetch with DELETE", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const mockFetch: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(null, { status: 204 });
  };

  await requestHardDelete("/api/admin/events/evt_1", mockFetch);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "/api/admin/events/evt_1");
  assert.equal(calls[0]?.init?.method, "DELETE");
});

test("successful response toasts and redirects", () => {
  const pushes: string[] = [];
  let refreshed = 0;
  const toasts: Array<{ title: string; variant?: string }> = [];

  const result = handleHardDeleteResponse({
    response: { ok: true, status: 204 },
    entityLabel: "Event",
    redirectTo: "/admin/events",
    deps: {
      push: (href) => pushes.push(href),
      refresh: () => {
        refreshed += 1;
      },
      toast: (toast) => {
        toasts.push({ title: toast.title, variant: toast.variant });
        return { id: "1", title: toast.title, message: toast.message, variant: toast.variant ?? "success" };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(pushes, ["/admin/events"]);
  assert.equal(refreshed, 1);
  assert.equal(toasts[0]?.title, "Event deleted permanently");
});

test("not authorized response shows auth error", () => {
  const toasts: Array<{ title: string; variant?: string }> = [];

  const result = handleHardDeleteResponse({
    response: { ok: false, status: 403 },
    entityLabel: "Venue",
    redirectTo: "/admin/venues",
    deps: {
      push: () => undefined,
      refresh: () => undefined,
      toast: (toast) => {
        toasts.push({ title: toast.title, variant: toast.variant });
        return { id: "1", title: toast.title, message: toast.message, variant: toast.variant ?? "success" };
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(toasts[0]?.title, "Not authorized");
  assert.equal(toasts[0]?.variant, "error");
});
