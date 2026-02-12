"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  role: "OWNER" | "EDITOR";
  user: { id: string; email: string; name: string | null };
};

export default function VenueMembersManager({ venueId, members }: { venueId: string; members: Member[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", role: "EDITOR" as "OWNER" | "EDITOR" });
  const [message, setMessage] = useState<string | null>(null);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch(`/api/my/venues/${venueId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body?.error?.message || "Failed to add member");
      return;
    }

    setForm((prev) => ({ ...prev, email: "" }));
    setMessage("Member saved.");
    router.refresh();
  }

  async function updateRole(memberId: string, role: "OWNER" | "EDITOR") {
    setMessage(null);
    const res = await fetch(`/api/my/venues/${venueId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body?.error?.message || "Failed to update role");
      return;
    }

    setMessage("Role updated.");
    router.refresh();
  }

  async function removeMember(memberId: string) {
    setMessage(null);
    const res = await fetch(`/api/my/venues/${venueId}/members/${memberId}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body?.error?.message || "Failed to remove member");
      return;
    }

    setMessage("Member removed.");
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Members</h2>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="border rounded p-2 flex flex-wrap items-center gap-2">
            <div className="mr-auto">
              <div className="font-medium">{member.user.name ?? member.user.email}</div>
              <div className="text-sm text-neutral-600">{member.user.email}</div>
            </div>
            <select
              className="border rounded p-1"
              value={member.role}
              onChange={(e) => updateRole(member.id, e.target.value as "OWNER" | "EDITOR")}
            >
              <option value="OWNER">OWNER</option>
              <option value="EDITOR">EDITOR</option>
            </select>
            <button className="rounded border px-2 py-1 text-sm" onClick={() => removeMember(member.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <form onSubmit={addMember} className="space-y-2 max-w-xl">
        <h3 className="font-medium">Add member</h3>
        <input
          className="border rounded p-2 w-full"
          placeholder="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <select className="border rounded p-2" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as "OWNER" | "EDITOR" }))}>
          <option value="EDITOR">EDITOR</option>
          <option value="OWNER">OWNER</option>
        </select>
        <div>
          <button className="rounded border px-3 py-1">Add member</button>
        </div>
      </form>
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}
