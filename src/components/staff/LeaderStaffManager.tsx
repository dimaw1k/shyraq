"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Search, UserPlus } from "lucide-react";
import { displayKzPhone, formatKzPhone, isValidKzPhone } from "@/lib/phone";
import { StatusPill } from "@/components/ui/ShyraqUI";
import { StaffModal } from "@/components/staff/StaffUI";

type StaffRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

type LookupProfile = StaffRow & {
  created_at: string;
  manageable?: boolean;
  message?: string;
};

const roleOptions = [{ value: "MENTOR", label: "Ментор" }];

const statusOptions = [
  { value: "ACTIVE", label: "Белсенді" },
  { value: "INACTIVE", label: "Өшірулі" },
  { value: "REGISTERED", label: "Тіркелген" },
  { value: "WAITING_FOR_TEAM", label: "Команда күтілуде" },
  { value: "COMPLETED", label: "Аяқтаған" },
];

function roleLabel(role: string) {
  if (role === "MENTOR") return "Ментор";
  if (role === "CHIEF_MENTOR") return "Аға ментор";
  if (role === "LEADER") return "Жетекші";
  return role;
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
    <div className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[11px] border border-[#E8E1DA] bg-white px-3 text-[10px] font-extrabold text-[#354153] transition hover:border-[#FFB067] disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate whitespace-nowrap">{label}</span>
        <ChevronDown size={13} className={open ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
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
                "flex w-full items-center justify-between rounded-[9px] px-3 py-2.5 text-left text-[10px] font-bold transition",
                value === option.value ? "bg-[#FFF1E2] text-[#D95F00]" : "text-[#4B433C] hover:bg-[#FAF7F3]",
              ].join(" ")}
            >
              <span className="whitespace-nowrap">{option.label}</span>
              {value === option.value ? <Check size={12} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LeaderStaffManager({ initialStaff }: { initialStaff: StaffRow[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<LookupProfile | null>(null);
  const [lookupRegistered, setLookupRegistered] = useState<boolean | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  function openAddModal() {
    setModalOpen(true);
    setLookup(null);
    setLookupRegistered(null);
    setLookupMessage("");
    setPhone("");
  }

  function closeAddModal() {
    if (lookupLoading || addLoading) return;
    setModalOpen(false);
  }

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
      } else {
        setLookupMessage(data.message ?? "Бұл нөмір тіркелмеген.");
      }
    } finally {
      setLookupLoading(false);
    }
  }

  async function addStaff() {
    if (!lookup || lookup.manageable === false || lookup.role !== "STUDENT") return;

    setAddLoading(true);
    setLookupMessage("");

    try {
      const response = await fetch("/api/leader/staff/" + lookup.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "MENTOR", status: "ACTIVE" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLookupMessage(data.error ?? "Қызметкерді қосу сәтсіз аяқталды.");
        return;
      }

      setStaff((current) => [...current, data.profile]);
      setMessage("Қызметкер қосылды.");
      setModalOpen(false);
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex min-h-10 items-center gap-2 rounded-[12px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,128,0,.16)] transition hover:bg-[#E56F00]"
        >
          <UserPlus size={14} />
          Қызметкер қосу
        </button>
      </div>

      <StaffModal
        open={modalOpen}
        onClose={closeAddModal}
        title="Қызметкер қосу"
        description="Телефон нөмірін тексеріп, қолжетімді болса тек Ментор рөлін тағайындаңыз."
      >
        <div className="grid gap-4">
          <div className="flex gap-2">
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
              className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] bg-[#FF8000] text-white disabled:opacity-50"
              aria-label="Іздеу"
            >
              {lookupLoading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
            </button>
          </div>

          {lookupRegistered === false ? (
            <div className="rounded-[14px] border border-[#F3D8C1] bg-[#FFF8F2] p-3.5">
              <p className="text-[11px] font-extrabold text-[#8A4B1F]">Аккаунт табылмады</p>
              <p className="mt-1 text-[10px] leading-5 text-[#7A685B]">Бұл нөмірмен платформада тіркелгі жоқ. Алдымен тіркелу қажет.</p>
            </div>
          ) : null}

          {lookup ? (
            <div className="rounded-[16px] border border-[#E8E1DA] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-extrabold text-[#172235]">{lookup.full_name}</p>
                  <p className="mt-1 text-[10px] text-[#8B8179]">{lookup.email}</p>
                </div>
                <StatusPill tone={lookup.status === "ACTIVE" ? "green" : lookup.status === "INACTIVE" ? "red" : "orange"}>
                  {statusLabel(lookup.status)}
                </StatusPill>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Телефон", displayKzPhone(lookup.phone)],
                  ["Қазіргі рөл", roleLabel(lookup.role)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[11px] bg-[#FFFCF9] px-3 py-2.5">
                    <p className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">{label}</p>
                    <p className="mt-1 truncate text-[10px] font-bold text-[#172235]">{value}</p>
                  </div>
                ))}
              </div>

              {lookup.manageable === false ? (
                <p className="mt-4 rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#655B53]">
                  {lookup.message ?? "Бұл аккаунтты Жетекші басқара алмайды."}
                </p>
              ) : lookup.role === "STUDENT" ? (
                <button
                  type="button"
                  disabled={addLoading}
                  onClick={() => void addStaff()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#172235] px-4 py-3 text-[10px] font-extrabold text-white disabled:opacity-60"
                >
                  {addLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Ментор ретінде қосу
                </button>
              ) : (
                <p className="mt-4 rounded-[12px] bg-[#F6F2ED] px-3 py-2.5 text-[10px] font-semibold text-[#655B53]">
                  Бұл пайдаланушы қазірдің өзінде ментор немесе жоғары рөлде.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#DED6CE] bg-[#FFFCF9] p-6 text-center">
              <UserPlus size={20} className="mx-auto text-[#FF8000]" />
              <p className="mt-2 text-[11px] font-extrabold text-[#4B433C]">Нөмір арқылы пайдаланушыны табыңыз</p>
            </div>
          )}

          {lookupMessage && lookupRegistered !== false ? (
            <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-semibold text-[#655B53]">{lookupMessage}</p>
          ) : null}
        </div>
      </StaffModal>

      <div className="divide-y divide-[#EFE8E1]">
        {staff.map((person) => {
          const saving = savingId === person.id;
          const privileged = person.role === "CHIEF_MENTOR" || person.role === "LEADER";
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
                disabled={saving || privileged}
                onChange={(value) => void patch(person.id, { role: value })}
              />
              <p className="truncate text-[9px] font-semibold text-[#8B8179]">{displayKzPhone(person.phone)}</p>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ChoiceMenu
                    label={statusLabel(person.status)}
                    value={person.status}
                    options={statusOptions}
                    disabled={saving || privileged}
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
          {message ? <span>{message}</span> : null}
          {savingId ? <StatusPill tone="orange">Сақталуда</StatusPill> : null}
        </div>
      </div>
    </div>
  );
}
