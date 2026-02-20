import { NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/admin";

type AdminRouteHandler<T> = (context: { email: string }) => Promise<T>;

export async function withAdminRoute<T>(handler: AdminRouteHandler<T>) {
  try {
    const admin = await requireAdmin({ redirectOnFail: false });
    return await handler(admin);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
