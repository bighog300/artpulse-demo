"use client";

import { useEffect, useState } from "react";

type Role = "USER" | "EDITOR" | "ADMIN";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
};

export function UsersManagerClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers(nextQuery: string) {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("query", nextQuery.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`, { method: "GET" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load users");
      setUsers(body.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function updateRole(userId: string, role: Role) {
    setSavingUserId(userId);
    setError(null);

    const previousUsers = users;
    setUsers((current) => current.map((item) => (item.id === userId ? { ...item, role } : item)));

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to update role");
      setUsers((current) => current.map((item) => (item.id === userId ? { ...item, role: body.user.role as Role } : item)));
    } catch (err) {
      setUsers(previousUsers);
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded border bg-background p-3 space-y-2">
        <label htmlFor="users-search" className="text-sm font-medium">Search users</label>
        <input
          id="users-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email or name"
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded border bg-background">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={4}>{busy ? "Loading users..." : "No users found."}</td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.name ?? "—"}</td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={user.role}
                    disabled={savingUserId === user.id}
                    onChange={(event) => void updateRole(user.id, event.target.value as Role)}
                  >
                    <option value="USER">USER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-3 py-2">{new Date(user.createdAt).toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
