import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteNavClient } from "../components/navigation/site-nav-client";

test("nav renders Sign in for unauthenticated visitors", () => {
  const html = renderToStaticMarkup(<SiteNavClient isAuthenticated={false} />);
  assert.match(html, /Sign in/);
  assert.doesNotMatch(html, /For You/);
  assert.doesNotMatch(html, /Saved Searches/);
});

test("nav shows auth links for authenticated users", () => {
  const html = renderToStaticMarkup(<SiteNavClient isAuthenticated />);
  assert.match(html, /For You/);
  assert.match(html, /Following/);
  assert.match(html, /Saved Searches/);
  assert.match(html, /Notifications/);
  assert.match(html, /Account/);
  assert.doesNotMatch(html, /Sign in/);
});
