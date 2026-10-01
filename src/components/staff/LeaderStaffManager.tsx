"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";

type StaffRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

export function LeaderStaffManager({ initialStaff }: { initialStaff: StaffRow[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function patch(id: string, patchBody: { role?: string; status?: string }) {
    setSavingId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/leader/staff/${id}`, {
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

  return (
    <div>
      <div className="divide-y divide-[#EFE8E1]">
        {staff.map((person) => {
          const saving = savingId === person.id;
          return (
            <div key={person.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1fr_1.15fr_115px] sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-extrabold text-[#354153]">{person.full_name}</p>
                <p className="mt-1 truncate text-[9px] text-[#9A9189]">{person.email}</p>
              </div>

              <select
                value={person.role}
                disabled={saving}
                onChange={(event) => void patch(person.id, { role: event.target.value })}
                className="rounded-[12px] border border-[#E8E1DA] bg-white px-3 py-2 text-[10px] font-extrabold text-[#354153] outline-none focus:border-[#FF6F2C]"
              >
                <option value="MENTOR">Ментор</option>
                <option value="CHIEF_MENTOR">Главный ментор</option>
                <option value="LEADER">Лидер</option>
              </select>

              <p className="text-[9px] font-semibold text-[#8B8179]">{person.phone || "Телефон жоқ"}</p>

              <div className="flex items-center gap-2">
                <select
                  value={person.status}
                  disabled={saving}
                  onChange={(event) => void patch(person.id, { status: event.target.value })}
                  className="min-w-0 flex-1 rounded-[12px] border border-[#E8E1DA] bg-white px-2.5 py-2 text-[9px] font-extrabold text-[#354153] outline-none focus:border-[#FF6F2C]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="WAITING_FOR_TEAM">WAITING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
                {saving ? <Loader2 size={13} className="animate-spin text-[#FF6F2C]" /> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#EFE8E1] bg-[#FFFCF9] px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-[9px] font-bold text-[#8B8179]">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#EEF9F3] text-[#318562]"><Check size={12} /></span>
          <span>{message || "Рөл немесе статус өзгергенде өзгеріс бірден Supabase-ке жазылады."}</span>
          {savingId ? <StatusPill tone="orange">Сақталуда</StatusPill> : null}
        </div>
      </div>
    </div>
  );
}
