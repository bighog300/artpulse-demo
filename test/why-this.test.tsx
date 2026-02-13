import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { WhyThis } from "../components/recommendations/why-this";

test("why-this toggle renders control", () => {
  const html = renderToStaticMarkup(<WhyThis reasons={["You follow this venue", "Near your saved location"]} />);
  assert.match(html, /Why am I seeing this\?/);
  assert.match(html, /aria-expanded="false"/);
});
