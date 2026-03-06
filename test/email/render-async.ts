import { type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export async function renderAsync(element: ReactElement) {
  const html = renderToStaticMarkup(element);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return { html, text };
}
