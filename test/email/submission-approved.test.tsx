import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { SubmissionApprovedEmail as EmailTemplate, getSubject } from "@/lib/email/templates/submission-approved";
import { renderAsync } from "./render-async";

test("submission-approved email snapshot", async (t) => {
  const payload = {};
  const subject = getSubject();
  const { html, text } = await renderAsync(createElement(EmailTemplate, payload));

  assert.match(subject, /Submission\ approved/i);
  assert.match(html, /approved\ and\ published/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
