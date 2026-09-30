import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Tasks", "/tasks"],
  ["Reports", "/reports"],
  ["Lessons", "/lessons"],
];

export function AppNav({ role }: { role: string }) {
  return (
    <nav className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/dashboard" className="font-bold tracking-tight">
          <span className="text-[var(--accent)]">Shyraq</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-zinc-50">
              {label}
            </Link>
          ))}
          {role === "MENTOR" ? (
            <Link href="/mentor" className="rounded-lg px-3 py-2 hover:bg-zinc-50">Mentor</Link>
          ) : null}
          {role === "ADMIN" ? (
            <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-zinc-50">Admin</Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
