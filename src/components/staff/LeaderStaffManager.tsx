"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Search, UserPlus } from "lucide-react";
import { formatKzPhone, isValidKzPhone } from "@/lib/phone";
import { StatusPill } from "@/components/ui/ShyraqUI";

type StaffRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  age?: number | null;
  education_type?: string | null;
};

type LookupProfile = StaffRow & {
  created_at: string;
  education_label: string;
  team_name: string | null;
  mentor_name: string | null;
};

const roleOptions = [
  { value: "MENTOR", label: "Ментор" },
  { value: "CHIEF_MENTOR", label: "Главный ментор" },
  { value: "LEADER", label: "Лидер" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Белсенді" },
  { value: "INACTIVE", label: "Өшірулі" },
  { value: "REGISTERED", label: "Тіркелген" },
  { value: "WAITING_FOR_TEAM", label: "Команда күтілуде" },
  { value: "COMPLETED", label: "Аяқтаған" },
];

function roleLabel(role: string) {
  return roleOptions.find((item) => item.value === role)?.label ?? role;
}

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function ChoiceMenu({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-9 w-full items-center justify-between gap-2 rounded-[11px] border border-[#E8E1DA] bg-white px-3 py-2 text-[10px] font-extrabold text-[#354153] transition hover:border-[#FFB067] disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[175px] rounded-[13px] border border-[#E8E1DA] bg-white p-1.5 shadow-[0_18px_40px_rgba(23,34,53,.12)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-left text-[10px] font-bold transition",
                value === option.value ? "bg-[#FFF1E2] text-[#D95F00]" : "text-[#4B433C] hover:bg-[#FAF7F3]",
              ].join(" ")}
            >
              <span>{option.label}</span>
              {value === option.value ? <Check size={12} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function educationLabel(value: string | null | undefined) {
  if (value === "SCHOOL") return "Мектеп";
  if (value === "COLLEGE") return "Колледж";
  if (value === "UNIVERSITY") return "Университет";
  return "Басқа";
}

export function LeaderStaffManager({ initialStaff }: { initialStaff: StaffRow[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<LookupProfile | null>(null);
  const [lookupRegistered, setLookupRegistered] = useState<boolean | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newRole, setNewRole] = useState("MENTOR");

  async function patch(id: string, patchBody: { role?: string; status?: string }) {
    setSavingId(id);
    setMessage("");

    try {
      const response = await fetch("/api/leader/staff/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error ?? "Өзгеріс сақталмады.");
        return;
      }

      setStaff((current) => current.map((item) => item.id === id ? data.profile : item));
      setMessage("Өзгеріс сақталды.");
    } finally {
      setSavingId(null);
    }
  }

  async function searchStaff() {
    setLookupLoading(true);
    setLookupMessage("");
    setLookup(null);
    setLookupRegistered(null);

    try {
      const response = await fetch("/api/leader/staff/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLookupMessage(data.error ?? "Іздеу сәтсіз аяқталды.");
        return;
      }

      setLookupRegistered(Boolean(data.registered));
      if (data.registered) {
        setLookup(data.profile);
        setNewRole(data.profile.role === "STUDENT" ? "MENTOR" : data.profile.role);
      } else {
        setLookupMessage(data.message ?? "Бұл нөмір тіркелмеген.");
      }
    } finally {
      setLookupLoading(false);
    }
  }

  async function addStaff() {
    if (!lookup) return;

    setAddLoading(true);
    setLookupMessage("");

    try {
      const response = await fetch("/api/leader/staff/" + lookup.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, status: "ACTIVE" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLookupMessage(data.error ?? "Қызметкерді қосу сәтсіз аяқталды.");
        return;
      }

      setStaff((current) => {
        const exists = current.some((item) => item.id === data.profile.id);
        return exists
          ? current.map((item) => item.id === data.profile.id ? data.profile : item)
          : [...current, data.profile];
      });
      setLookup(data.profile);
      setLookupMessage("Қызметкер сәтті қосылды.");
    } finally {
      setAddLoading(false);
    }
  }

  const roleIsStaff = lookup && lookup.role !== "STUDENT";

  return (
    <div>
      <div className="border-b border-[#EFE8E1] bg-[#FFFCF9] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">ҚЫЗМЕТКЕР ҚОСУ</p>
            <h2 className="mt-1.5 text-lg font-extrabold tracking-[-.02em] text-[#172235]">Телефон нөмірімен тексеру</h2>
            <p className="mt-1.5 max-w-md text-[11px] leading-5 text-[#766E66]">
              Нөмірді енгізіңіз. Тіркелгі болса, барлық негізгі дерек бірден көрінеді.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                value={phone}
                onChange={(event) => setPhone(formatKzPhone(event.target.value))}
                placeholder="+7 (700) 000 00 00"
                maxLength={18}
                inputMode="tel"
                className="min-w-0 flex-1 rounded-[13px] border border-[#E8E1DA] bg-white px-3.5 py-3 text-xs font-semibold outline-none transition focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/10"
              />
              <button
                type="button"
                disabled={lookupLoading || !isValidKzPhone(phone)}
                onClick={() => void searchStaff()}
                className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] bg-[#FF8000] text-white transition hover:bg-[#E56F00] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Қызметкерді іздеу"
              >
                {lookupLoading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
              </button>
            </div>

            {lookupRegistered === false ? (
              <div className="mt-3 rounded-[14px] border border-[#F3D8C1] bg-[#FFF8F2] p-3.5">
                <p className="text-[11px] font-extrabold text-[#8A4B1F]">Аккаунт табылмады</p>
                <p className="mt-1 text-[10px] leading-5 text-[#7A685B]">
                  Бұл нөмірмен Shyraq-та тіркелгі жоқ. Қызметкер ретінде қосу үшін алдымен платформаға тіркелуі керек.
                </p>
              </div>
            ) : null}

            {lookupMessage && lookupRegistered !== false ? (
              <p className="mt-3 rounded-[13px] bg-white p-3 text-[10px] font-semibold leading-5 text-[#655B53]">{lookupMessage}</p>
            ) : null}
          </div>

          {lookup ? (
            <div className="rounded-[18px] border border-[#E8E1DA] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-extrabold text-[#172235]">{lookup.full_name}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#8B8179]">{lookup.email}</p>
                </div>
                <StatusPill tone={lookup.status === "ACTIVE" ? "green" : lookup.status === "INACTIVE" ? "red" : "orange"}>
                  {statusLabel(lookup.status)}
                </StatusPill>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["Телефон", lookup.phone],
                  ["Жасы", String(lookup.age ?? "—")],
                  ["Білім деңгейі", lookup.education_label ?? educationLabel(lookup.education_type)],
                  ["Қазіргі рөл", roleLabel(lookup.role)],
                  ["Команда", lookup.team_name ?? "Тағайындалмаған"],
                  ["Ментор", lookup.mentor_name ?? "Тағайындалмаған"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[12px] bg-[#FFFCF9] px-3 py-2.5">
                    <p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">{label}</p>
                    <p className="mt-1 truncate text-[10px] font-bold text-[#172235]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
                  {roleIsStaff ? "Рөлді басқару" : "Қызметкер рөлін таңдаңыз"}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={addLoading}
                      onClick={() => setNewRole(option.value)}
                      className={[
                        "rounded-[11px] border px-2 py-2.5 text-[9px] font-extrabold transition",
                        newRole === option.value
                          ? "border-[#FF8000] bg-[#FFF1E2] text-[#C95500]"
                          : "border-[#E8E1DA] bg-white text-[#5A514A] hover:border-[#FFB067]",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={addLoading}
                onClick={() => void addStaff()}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#172235] px-4 py-3 text-[10px] font-extrabold text-white transition hover:bg-[#0F1826] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {roleIsStaff ? "Рөлді сақтау" : "Қызметкер ретінде қосу"}
              </button>

              {lookupMessage ? (
                <p className="mt-2 text-[9px] font-semibold text-[#6F655D]">{lookupMessage}</p>
              ) : null}
            </div>
          ) : (
            <div className="grid min-h-[250px] place-items-center rounded-[18px] border border-dashed border-[#E1D8CF] bg-white p-6 text-center">
              <div>
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] bg-[#FFF1E2] text-[#FF8000]">
                  <UserPlus size={18} />
                </div>
                <p className="mt-3 text-[11px] font-extrabold text-[#4B433C]">Қызметкерді телефон арқылы табыңыз</p>
                <p className="mt-1 text-[10px] leading-5 text-[#9A9189]">Тіркелген пайдаланушының деректері осы жерде шығады.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#EFE8E1]">
        {staff.map((person) => {
          const saving = savingId === person.id;
          return (
            <div key={person.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.15fr_170px_1fr_185px] sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-extrabold text-[#354153]">{person.full_name}</p>
                <p className="mt-1 truncate text-[9px] text-[#9A9189]">{person.email}</p>
              </div>

              <ChoiceMenu
                label={roleLabel(person.role)}
                value={person.role}
                options={roleOptions}
                disabled={saving}
                onChange={(value) => void patch(person.id, { role: value })}
              />

              <p className="truncate text-[9px] font-semibold text-[#8B8179]">{person.phone || "Телефон жоқ"}</p>

              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ChoiceMenu
                    label={statusLabel(person.status)}
                    value={person.status}
                    options={statusOptions}
                    disabled={saving}
                    onChange={(value) => void patch(person.id, { status: value })}
                  />
                </div>
                {saving ? <Loader2 size={13} className="shrink-0 animate-spin text-[#FF8000]" /> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-[9px] font-bold text-[#8B8179]">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#EEF9F3] text-[#318562]"><Check size={12} /></span>
          <span>{message || "Рөл мен статус өзгерісі бірден сақталады."}</span>
          {savingId ? <StatusPill tone="orange">Сақталуда</StatusPill> : null}
        </div>
      </div>
    </div>
  );
}
