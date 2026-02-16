import { NextResponse } from "next/server";

export function apiError(status: number, code: string, message: string, details?: unknown, requestId?: string) {
  return NextResponse.json({ error: { code, message, details, requestId } }, { status });
}
