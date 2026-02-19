export function trackServerEvent(event: { name: string; props?: Record<string, unknown>; path: string; ts: string }) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics:server]", event.name, event.props ?? {});
    return;
  }
  console.info("[analytics:server]", JSON.stringify({
    name: event.name,
    path: event.path,
    ts: event.ts,
  }));
}
