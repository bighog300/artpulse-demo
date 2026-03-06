import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import EmailTemplate, { getSubject } from "@/lib/email/templates/venue-claim-approved";
import { renderAsync } from "./render-async";

test("venue-claim-approved email snapshot", async (t) => {
  const payload = { venueName: "Harbor Light Gallery", venueSlug: "harbor-light-gallery" };
  const subject = getSubject(payload as never);
  const { html, text } = await renderAsync(createElement(EmailTemplate, { venueName: payload.venueName, venueSlug: payload.venueSlug }));

  assert.match(subject, /Harbor\ Light\ Gallery/i);
  assert.match(html, /Go\ to\ dashboard/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
