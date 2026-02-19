export function dateGroupLabel(input: Date, now = new Date()) {
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const diffDays = Math.floor((startNow.getTime() - startDate.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return input.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
