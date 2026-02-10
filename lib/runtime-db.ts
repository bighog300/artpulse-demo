export function hasDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  return typeof value === "string" && value.trim().length > 0;
}
