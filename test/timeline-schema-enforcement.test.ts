import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleTimelineSummarizePost } from "../lib/timeline-summarize-route";
import { handleAdminSettingsPut, handleSelectionSetPut } from "../lib/timeline-config-routes";

test("POST /api/timeline/summarize returns 400 for invalid summarize request", async () => {
  const req = new NextRequest("http://localhost/api/timeline/summarize", {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": "req-invalid" },
    body: JSON.stringify({ prompt: "", summaryFileIds: ["a"] }),
  });

  const res = await handleTimelineSummarizePost(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
  assert.equal(body.error.requestId, "req-invalid");
});

test("POST /api/timeline/summarize skips corrupt Drive summary JSON", async () => {
  const warnings: unknown[] = [];
  const warn = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args);
  try {
    const req = new NextRequest("http://localhost/api/timeline/summarize", {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": "req-drive" },
      body: JSON.stringify({ prompt: "hello", summaryFileIds: ["good", "bad"] }),
    });

    const res = await handleTimelineSummarizePost(req, {
      readSummaryJson: async (fileId) => fileId === "good"
        ? JSON.stringify({ id: "good", title: "T", text: "content" })
        : "{not-json",
      summarize: async (_prompt, artifacts) => ({ summary: artifacts.map((artifact) => artifact.id).join(",") || "none" }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.summary, "good");
    assert.equal(body.artifactCount, 1);
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = warn;
  }
});

test("PUT /api/timeline/selection-set validates SelectionSetSchema", async () => {
  const req = new NextRequest("http://localhost/api/timeline/selection-set", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ids: "not-array", updatedAt: 123 }),
  });

  const res = await handleSelectionSetPut(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});

test("PUT /api/admin/settings validates AdminSettingsSchema", async () => {
  const req = new NextRequest("http://localhost/api/admin/settings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ allowSummaries: "yes", maxArtifacts: -1 }),
  });

  const res = await handleAdminSettingsPut(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});
