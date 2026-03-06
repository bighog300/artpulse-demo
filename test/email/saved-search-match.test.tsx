import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { SavedSearchMatchEmail as EmailTemplate, getSubject } from "@/lib/email/templates/saved-search-match";
import { renderAsync } from "./render-async";

test("saved-search-match email snapshot", async (t) => {
  const payload = { searchName: "Brooklyn openings", eventTitle: "Neon Horizons", eventSlug: "neon-horizons" };
  const subject = getSubject(payload as never);
  const { html, text } = await renderAsync(createElement(EmailTemplate, payload));

  assert.match(subject, /Neon\ Horizons/i);
  assert.match(html, /View\ event/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
