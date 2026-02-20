import { EmptyState } from "@/components/ui/empty-state";

export function DataSourceEmptyState({ isAdmin, showDevHint }: { isAdmin?: boolean; showDevHint?: boolean }) {
  return (
    <EmptyState
      title="Data source not configured for this deployment"
      description="This environment is missing the database connection required to load live content."
      actions={[
        { label: "Deployment readiness", href: "/api/ready" },
        { label: "Environment docs", href: "/docs/ENVIRONMENTS.md", variant: "secondary" },
      ]}
    >
      <div className="space-y-2 text-sm text-muted-foreground">
        {showDevHint ? <p>Set DATABASE_URL to view live data locally during development.</p> : null}
        {isAdmin ? <p>Check Vercel env vars for Preview/Production.</p> : null}
      </div>
    </EmptyState>
  );
}
