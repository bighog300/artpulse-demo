type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  message: string;
  requestId?: string;
  [key: string]: unknown;
};

function emit(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function logInfo(payload: LogPayload) {
  emit("info", payload);
}

export function logWarn(payload: LogPayload) {
  emit("warn", payload);
}

export function logError(payload: LogPayload) {
  emit("error", payload);
}
