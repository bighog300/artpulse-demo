import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import EmailTemplate, { getSubject } from "@/lib/email/templates/event-change";
import { renderAsync } from "./render-async";

test("event-change email snapshot", async (t) => {
  const payload = { eventTitle: "After Hours Drawing", eventSlug: "after-hours-drawing", changedFields: ["Start time", "Ticket availability"] };
  const subject = getSubject(payload as never);
  const { html, text } = await renderAsync(createElement(EmailTemplate, payload));

  assert.match(subject, /After\ Hours\ Drawing/i);
  assert.match(html, /View\ updated\ event/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
