import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "../components/ui/page-header";

test("PageHeader renders title subtitle and actions", () => {
  const html = renderToStaticMarkup(
    <PageHeader
      title="Events"
      subtitle="Upcoming events near you"
      actions={<button type="button">Refresh</button>}
    />,
  );

  assert.match(html, /Events/);
  assert.match(html, /Upcoming events near you/);
  assert.match(html, /Refresh/);
});
