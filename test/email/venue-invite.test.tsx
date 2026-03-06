import assert from "node:assert";
import test from "node:test";
import { createElement } from "react";
import { VenueInviteEmail as EmailTemplate, getSubject } from "@/lib/email/templates/venue-invite";
import { renderAsync } from "./render-async";

test("venue-invite email snapshot", async (t) => {
  const payload = { inviteId: "inv_42", inviteToken: "token_abc123", venueId: "ven_77", role: "Manager" };
  const subject = getSubject();
  const { html, text } = await renderAsync(createElement(EmailTemplate, {
    inviteId: payload.inviteId,
    inviteToken: payload.inviteToken,
    venueId: payload.venueId,
    role: payload.role,
  }));

  assert.match(subject, /invited to manage a venue/i);
  assert.match(html, /Open\ invitation/i);
  assert.ok(typeof html === "string" && html.length > 100, "html should be a non-empty string");
  assert.ok(typeof text === "string" && text.length > 0, "text should be a non-empty string");
});
