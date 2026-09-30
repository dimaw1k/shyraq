import Link from "next/link";

const features = [
  ["01", "Daily discipline", "Tasks, daily reports and streaks in one place."],
  ["02", "Kinescope lessons", "Video progress and an 85% watch gate before tests."],
  ["03", "Meet attendance", "Team-based Google Meet attendance and session totals."],
  ["04", "Team performance", "Mentor-level and marathon-level operational analytics."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium">
            SHYRAQ • MARATHON PLATFORM
          </div>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            Discipline becomes measurable.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            One operational platform for students, mentors and marathon heads:
            tasks, reports, Kinescope lessons, Google Meet attendance, points and
            rankings.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Student registration
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-black/10 bg-white px-5 py-3 font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-2">
          {features.map(([number, title, description]) => (
            <div
              key={number}
              className="rounded-2xl border border-[var(--border)] bg-white p-6"
            >
              <div className="text-sm font-semibold text-[var(--accent)]">
                {number}
              </div>
              <h2 className="mt-3 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
