import { UsersManagerClient } from "./users-manager-client";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <main className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Search users and manage USER/EDITOR/ADMIN roles.</p>
      </div>
      <UsersManagerClient />
    </main>
  );
}
