import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import EmailTemplate from "@/lib/email/templates/rsvp-confirmation";
import { renderAsync } from "./email/render-async";

test("renders QR code image in RSVP confirmation email", async () => {
  const payload = {
    eventTitle: "After Hours Drawing",
    eventSlug: "after-hours-drawing",
    venueName: "Canal Arts Center",
    startAt: "2026-04-12T19:00:00.000Z",
    venueAddress: "58 Canal St, New York, NY",
    confirmationCode: "AP-2X9K",
  };

  const { html } = await renderAsync(createElement(EmailTemplate, payload));
  assert.match(html, /<img[^>]+alt="Confirmation QR code"/i);
  assert.match(html, /src="data:image\/png;base64,[^"]+"/i);
  assert.match(html, /width="160"/i);
  assert.match(html, /height="160"/i);
});
