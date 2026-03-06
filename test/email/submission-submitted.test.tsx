import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { SubmissionSubmittedEmail as EmailTemplate, getSubject } from "@/lib/email/templates/submission-submitted";
import { renderAsync } from "./render-async";

test("submission-submitted email snapshot", async (t) => {
  const payload = { submissionType: "EVENT" as const };
  const subject = getSubject();
  const { html, text } = await renderAsync(createElement(EmailTemplate, { submissionType: payload.submissionType }));

  assert.match(subject, /Submission\ received/i);
  assert.match(html, /pending\ moderation/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
