import test from "node:test";
import assert from "node:assert/strict";
import { getEventPublishIssues } from "../lib/event-publish.ts";

const validInput = {
  title: "Gallery Night Opening",
  startAt: new Date("2026-01-01T18:00:00.000Z"),
  endAt: new Date("2026-01-01T20:00:00.000Z"),
  description: "An evening opening featuring new installations and a guided walk-through with participating artists.",
  venueId: "11111111-1111-4111-8111-111111111111",
  ticketUrl: "https://tickets.example.com/event",
  images: [{ id: "img-1" }],
};

test("getEventPublishIssues returns title issue when title is missing", () => {
  const issues = getEventPublishIssues({ ...validInput, title: "" });
  assert.equal(issues.some((issue) => issue.field === "title"), true);
});

test("getEventPublishIssues returns endAt issue when endAt is before startAt", () => {
  const issues = getEventPublishIssues({
    ...validInput,
    startAt: new Date("2026-01-02T20:00:00.000Z"),
    endAt: new Date("2026-01-02T18:00:00.000Z"),
  });
  assert.equal(issues.some((issue) => issue.field === "endAt"), true);
});

test("getEventPublishIssues returns description issue when description is missing", () => {
  const issues = getEventPublishIssues({ ...validInput, description: "short" });
  assert.equal(issues.some((issue) => issue.field === "description"), true);
});

test("getEventPublishIssues returns no issues for a complete event", () => {
  const issues = getEventPublishIssues(validInput);
  assert.deepEqual(issues, []);
});
