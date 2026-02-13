import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ToastViewport } from "../components/ui/toast";
import { enqueueToast } from "../lib/toast";

test("toast enqueue renders viewport", () => {
  enqueueToast({ title: "Saved" });
  const html = renderToStaticMarkup(<ToastViewport />);
  assert.match(html, /aria-live="polite"/);
});
