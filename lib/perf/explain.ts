import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { explainQueryBuilders, type ExplainQueryName } from "@/lib/perf/queries";

const QUERY_TIMEOUT_MS = 8_000;

export async function runExplain(queryName: ExplainQueryName, queryParams: Record<string, unknown>): Promise<string> {
  if (process.env.PERF_EXPLAIN_ENABLED !== "true") throw new Error("explain_disabled");
  if (process.env.NODE_ENV === "production" && process.env.PERF_EXPLAIN_ALLOW_PROD !== "true") throw new Error("explain_disabled");

  const buildQuery = explainQueryBuilders[queryName];
  if (!buildQuery) throw new Error("unknown_query");

  const target = buildQuery(queryParams);
  const allowAnalyze = process.env.PERF_ALLOW_ANALYZE === "true";
  const explainPrefix = allowAnalyze
    ? Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) `
    : Prisma.sql`EXPLAIN (FORMAT TEXT) `;

  const query = Prisma.sql`${explainPrefix}${target.query}`;
  const runQuery = db.$queryRaw(query) as Promise<Array<Record<string, unknown>>>;
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
