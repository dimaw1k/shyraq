"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";
import { displayKzPhone, formatKzPhone, isValidKzPhone } from "@/lib/phone";

type Mentor = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  avatar_url: string | null;
  team_name: string;
  student_count: number;
};

type Lookup = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  avatar_url: string | null;
  team_name: string | null;
};

export function ChiefMentorMentorManager({
  initialMentors,
}: {
  initialMentors: Mentor[];
}) {
  const [mentors, setMentors] = useState(initialMentors);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredMentors = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("kk-KZ");
    if (!normalized) return mentors;

    return mentors.filter((mentor) =>
      [mentor.full_name, mentor.email, mentor.phone, mentor.team_name]
        .filter(Boolean)
        .some((value) =>
          value.toLocaleLowerCase("kk-KZ").includes(normalized),
        ),
    );
  }, [mentors, query]);

  function resetModal() {
    setOpen(false);
    setIdentifier("");
    setLookup(null);
    setMessage("");
    setLoading(false);
    setSaving(false);
  }

  function handleIdentifierChange(value: string) {
    const looksLikeEmail = /[A-Za-z@_\-.]/.test(value);
    setIdentifier(looksLikeEmail ? value : formatKzPhone(value));
  }

  function canSearchIdentifier() {
    const value = identifier.trim();
    return value.includes("@") ? /^\S+@\S+\.\S+$/.test(value) : isValidKzPhone(value);
  }

  async function searchMentor() {
    setLoading(true);
    setMessage("");
    setLookup(null);

    try {
      const response = await fetch("/api/chief-mentor/mentors/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Іздеу сәтсіз аяқталды.");
      }

      if (!data.profile) {
        setMessage("Бұл телефон немесе email арқылы аккаунт табылмады.");
        return;
      }

      setLookup(data.profile);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  async function addMentor() {
    if (!lookup || lookup.role === "MENTOR") return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chief-mentor/mentors/" + lookup.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "MENTOR", status: "ACTIVE" }),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ?? "Менторды қосу сәтсіз аяқталды.",
        );
      }

      const profile = data.profile;
      setMentors((current) =>
        current.some((item) => item.id === profile.id)
          ? current.map((item) =>
              item.id === profile.id
                ? {
                    ...item,
                    ...profile,
                    avatar_url: profile.avatar_url ?? item.avatar_url ?? null,
                  }
                : item,
            )
          : [
              {
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
                status: profile.status,
                avatar_url: profile.avatar_url ?? null,
                team_name: "",
                student_count: 0,
              },
              ...current,
            ],
      );

      resetModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--accent)]">
            МЕНТОРЛАР
          </p>
          <h1 className="mt-1 text-[25px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[30px]">
            Менторлар
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setIdentifier("");
            setLookup(null);
            setMessage("");
          }}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] bg-[var(--accent)] px-4 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,128,0,.13)] transition hover:bg-[#E56F00]"
        >
          <UserPlus size={14} />
          Ментор қосу
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A19890]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Менторды іздеу..."
            className="h-11 w-full rounded-[13px] border border-[#E8E1DA] bg-white pl-10 pr-3.5 text-[11px] font-semibold text-[#172235] outline-none transition focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
          />
        </div>
        <button
          type="button"
          onClick={() => setQuery(query.trim())}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[13px] bg-[#172235] px-4 text-[10px] font-extrabold text-white"
        >
          <Search size={14} />
          Іздеу
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#172235]/42 p-4 backdrop-blur-[10px] sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            className={[
              "w-full overflow-hidden rounded-[20px] border border-white/90 bg-white shadow-[0_24px_80px_rgba(23,34,53,.28)]",
              lookup ? "max-w-[500px]" : "max-w-[400px]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E8E1DA] px-4 py-3.5">
              <h2 className="text-[16px] font-extrabold tracking-[-.03em] text-[#172235]">
                Ментор қосу
              </h2>
              <button
                type="button"
                onClick={resetModal}
                disabled={loading || saving}
                className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#E8E1DA] bg-white text-[#5B534C] disabled:opacity-50"
                aria-label="Жабу"
              >
                <X size={15} />
              </button>
            </div>

            <div className={lookup ? "space-y-3 p-4" : "p-4"}>
              <div className="flex gap-2">
                <input
                  value={identifier}
                  onChange={(event) => handleIdentifierChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canSearchIdentifier()) {
                      void searchMentor();
                    }
                  }}
                  autoFocus
                  inputMode={identifier.includes("@") ? "email" : "tel"}
                  placeholder="Телефон немесе email"
                  className="h-11 min-w-0 flex-1 rounded-[12px] border border-[#E8E1DA] bg-white px-3.5 text-[11px] font-semibold text-[#172235] outline-none focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
                />
                <button
                  type="button"
                  disabled={loading || !canSearchIdentifier()}
                  onClick={() => void searchMentor()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--accent)] text-white disabled:opacity-50"
                  aria-label="Менторды іздеу"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Search size={15} />
                  )}
                </button>
              </div>

              {lookup ? (
                <div className="rounded-[15px] border border-[#E8E1DA] bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    {lookup.avatar_url ? (
                      <Image
                        src={lookup.avatar_url}
                        alt=""
                        width={42}
                        height={42}
                        unoptimized
                        className="h-[42px] w-[42px] shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#FFF1E2] text-[11px] font-extrabold text-[#C15F00]">
                        {lookup.full_name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold text-[#172235]">
                        {lookup.full_name}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-[#91877F]">
                        {lookup.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[11px] bg-[#FFFCF9] px-3 py-2.5">
                      <p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">
                        Телефон
                      </p>
                      <p className="mt-1 text-[10px] font-extrabold text-[#172235]">
                        {displayKzPhone(lookup.phone)}
                      </p>
                    </div>
                    <div className="rounded-[11px] bg-[#FFFCF9] px-3 py-2.5">
                      <p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">
                        Команда
                      </p>
                      <p className="mt-1 truncate text-[10px] font-extrabold text-[#172235]">
                        {lookup.team_name || "—"}
                      </p>
                    </div>
                  </div>

                  {lookup.role === "MENTOR" ? (
                    <div className="mt-3 rounded-[11px] bg-[#EDF8F2] px-3 py-2.5 text-[10px] font-extrabold text-[#2E7E58]">
                      Бұл қолданушы қазірдің өзінде ментор.
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void addMentor()}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[11px] bg-[#172235] text-[10px] font-extrabold text-white disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Ментор ретінде қосу
                    </button>
                  )}
                </div>
              ) : null}

              {message ? (
                <p className="rounded-[11px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#8A4B1F]">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="hidden lg:grid lg:grid-cols-[minmax(260px,1.35fr)_minmax(220px,1fr)_minmax(170px,.85fr)_minmax(170px,.8fr)_110px] items-center gap-4 border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.09em] text-[#81776F]">
          <span>Ментор</span>
          <span>Почта</span>
          <span>Телефон нөмірі</span>
          <span>Команда</span>
          <span>Оқушылар</span>
        </div>

        <div className="divide-y divide-[#EFE8E1]">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(260px,1.35fr)_minmax(220px,1fr)_minmax(170px,.85fr)_minmax(170px,.8fr)_110px] lg:items-center lg:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {mentor.avatar_url ? (
                  <Image
                    src={mentor.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[rgba(255,128,0,.12)]"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF1E2] text-[10px] font-extrabold text-[#C15F00]">
                    {mentor.full_name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("")}
                  </span>
                )}
                <p className="truncate text-[13px] font-extrabold text-[#263247]">
                  {mentor.full_name}
                </p>
              </div>

              <p className="truncate text-[12px] font-semibold text-[#5E554E]">
                {mentor.email || "—"}
              </p>

              <p className="text-[12px] font-extrabold text-[#354153]">
                {displayKzPhone(mentor.phone)}
              </p>

              <p className="truncate text-[12px] font-extrabold text-[#354153]">
                {mentor.team_name || "—"}
              </p>

              <p className="text-[13px] font-extrabold text-[#172235]">
                {mentor.student_count}
              </p>
            </div>
          ))}

          {!filteredMentors.length ? (
            <div className="px-5 py-10 text-center text-[11px] font-semibold text-[#8B8179]">
              {mentors.length
                ? "Іздеу бойынша ментор табылмады."
                : "Ментор жоқ."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
