import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import EmailTemplate, { getSubject } from "@/lib/email/templates/rsvp-cancellation";
import { renderAsync } from "./render-async";

test("rsvp-cancellation email snapshot", async (t) => {
  const payload = { eventTitle: "After Hours Drawing", eventSlug: "after-hours-drawing", venueName: "Canal Arts Center", startAt: "2026-04-12T19:00:00.000Z", venueAddress: "58 Canal St, New York, NY", reason: "The host is rescheduling due to weather." };
  const subject = getSubject(payload as never);
  const { html, text } = await renderAsync(createElement(EmailTemplate, payload));

  assert.match(subject, /After\ Hours\ Drawing/i);
  assert.match(html, /View\ event/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
