"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  education_type: string;
  education_place: string;
  status: string;
  role: string;
  created_at: string;
};

const ROLES = ["STUDENT", "MENTOR", "ADMIN"];
const STATUSES = ["WAITING_FOR_TEAM", "ACTIVE", "INACTIVE", "COMPLETED"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (role) params.set("role", role);
    if (status) params.set("status", status);

    const response = await fetch("/api/admin/users?" + params.toString());
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setUsers(data.users ?? []);
      setMessage("");
    } else {
      setMessage(data.error ?? "Пайдаланушылар жүктелмеді.");
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/admin/users")
      .then((response) => response.json())
      .then((data: { users?: UserRow[]; error?: string }) => {
        if (cancelled) return;
        if (data.users) setUsers(data.users);
        else setMessage(data.error ?? "Пайдаланушылар жүктелмеді.");
      })
      .catch(() => {
        if (!cancelled) setMessage("Пайдаланушылар жүктелмеді.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateUser(user: UserRow, patch: { role?: string; status?: string }) {
    const response = await fetch("/api/admin/users/" + user.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Өзгерту орындалмады.");
      return;
    }
    setUsers((current) => current.map((item) => item.id === user.id ? data.profile : item));
    setMessage("Пайдаланушы жаңартылды.");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-semibold">← Admin</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">USERS</p>
            <h1 className="mt-2 text-3xl font-semibold">Пайдаланушылар</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Student, mentor және admin аккаунттарының рөлі мен статусын басқарыңыз.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 lg:grid-cols-[1fr_180px_220px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void load(); }}
            placeholder="Аты, email немесе телефон"
            className="rounded-xl border border-[var(--border)] px-4 py-3"
          />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-[var(--border)] px-4 py-3">
            <option value="">Барлық рөл</option>
            {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[var(--border)] px-4 py-3">
            <option value="">Барлық статус</option>
            {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Жүктелуде..." : "Іздеу"}
          </button>
        </div>

        {message ? <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm">{message}</div> : null}

        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_220px_220px] lg:items-center">
                <div>
                  <p className="font-semibold">{user.full_name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{user.phone} · {user.education_place}</p>
                </div>

                <div className="text-sm">
                  <p><span className="text-[var(--muted)]">Жасы:</span> {user.age}</p>
                  <p className="mt-1"><span className="text-[var(--muted)]">Оқу:</span> {user.education_type}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">ID: {user.id}</p>
                </div>

                <select
                  value={user.role}
                  onChange={(event) => void updateUser(user, { role: event.target.value })}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>

                <select
                  value={user.status}
                  onChange={(event) => void updateUser(user, { status: event.target.value })}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  {["REGISTERED", ...STATUSES].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </article>
          ))}

          {!users.length ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--muted)]">
              Пайдаланушы табылмады.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
