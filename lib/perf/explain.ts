import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const MAX_SQL_LENGTH = 4000;
const writePattern = /\b(insert|update|delete|alter|drop|truncate|create)\b/i;
const QUERY_TIMEOUT_MS = 8_000;

export function assertExplainSafe(sql: string) {
  const trimmed = sql.trim();
  if (!trimmed) throw new Error("invalid_sql");
  if (trimmed.length > MAX_SQL_LENGTH) throw new Error("sql_too_long");
  if (trimmed.includes(";")) throw new Error("semicolon_not_allowed");
  if (writePattern.test(trimmed)) throw new Error("write_not_allowed");
}

export async function runExplain(sql: string, params: unknown[]): Promise<string> {
  assertExplainSafe(sql);

  const allowAnalyze = process.env.PERF_ALLOW_ANALYZE === "true";
  const explainPrefix = allowAnalyze
    ? Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) `
    : Prisma.sql`EXPLAIN (FORMAT TEXT) `;

  const query = Prisma.sql`${explainPrefix}${Prisma.raw(sql)}`;
  const runQuery = db.$queryRawUnsafe(query.sql, ...query.values, ...params) as Promise<Array<Record<string, unknown>>>;
  const rows = await Promise.race([
    runQuery,
    new Promise<Array<Record<string, unknown>>>((_, reject) => {
      setTimeout(() => reject(new Error("explain_timeout")), QUERY_TIMEOUT_MS);
    }),
  ]);

  return rows
    .map((row: Record<string, unknown>) => {
      const first = Object.values(row)[0];
      return typeof first === "string" ? first : String(first ?? "");
    })
    .join("\n");
}
