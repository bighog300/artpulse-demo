export function digestClickPayload(args: { digestRunId: string; targetId: string; position: number }) {
  return {
    surface: "DIGEST" as const,
    action: "CLICK" as const,
    targetType: "EVENT" as const,
    targetId: args.targetId,
    meta: { digestRunId: args.digestRunId, position: args.position },
  };
}
