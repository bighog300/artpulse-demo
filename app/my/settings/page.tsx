import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";

export default async function MySettingsPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/settings");

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Publisher preferences and notification settings.</p>
      </header>

      <section className="space-y-3 rounded border p-4">
        <div>
          <h2 className="text-lg font-medium">Notifications</h2>
          <p className="text-sm text-muted-foreground">Choose which updates we send to your inbox.</p>
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked readOnly className="mt-1" />
            <span>Email me when submissions are approved or rejected</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked readOnly className="mt-1" />
            <span>Email me when I receive team invites</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" readOnly className="mt-1" />
            <span>Send me a weekly publisher digest</span>
          </label>
        </div>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="text-lg font-medium">Default venue</h2>
        <p className="text-sm text-muted-foreground">Coming soon: choose a default venue for dashboard filters and quick actions.</p>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="text-lg font-medium">Publishing preferences</h2>
        <p className="text-sm text-muted-foreground">Coming soon: set publishing defaults for new events, venues, and artwork drafts.</p>
      </section>
    </main>
  );
}
