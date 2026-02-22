import Link from "next/link";
import type { CheckItem } from "@/lib/publish-readiness";

export function PublishReadinessChecklist({ title, ready, blocking, warnings }: { title: string; ready: boolean; blocking: CheckItem[]; warnings: CheckItem[] }) {
  return (
    <section id="publish-readiness" className="space-y-2 rounded border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
          {ready ? "Ready to submit" : "Not ready"}
        </span>
      </div>
      {blocking.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
          {blocking.map((item) => <li key={item.id}>{item.label} {item.href ? <Link href={item.href} className="underline">Fix</Link> : null}</li>)}
        </ul>
      ) : <p className="text-sm text-emerald-700">All required fields complete.</p>}
      {warnings.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {warnings.map((item) => <li key={item.id}>{item.label} {item.href ? <Link href={item.href} className="underline">Fix</Link> : null}</li>)}
        </ul>
      ) : null}
    </section>
  );
}
