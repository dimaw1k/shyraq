"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ui/ShyraqUI";
import { StaffModal, staffInputClass } from "@/components/staff/StaffUI";

export function StaffCreateTeamForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("70");

  function reset() {
    setName("");
    setCapacity("70");
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, capacity: Number(capacity) }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error ?? "Команда сақталмады.");
        return;
      }

      setOpen(false);
      reset();
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PrimaryButton type="button" onClick={() => { reset(); setOpen(true); }}>
        <Plus size={14} />
        Команда қосу
      </PrimaryButton>

      <StaffModal
        open={open}
        onClose={() => { if (!loading) setOpen(false); }}
        title="Жаңа команда"
        description="Команда атауы мен оқушы сыйымдылығын енгізіңіз."
      >
        <form onSubmit={submit} className="grid gap-4">
          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Команда атауы
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
              placeholder="Мысалы: Самғау"
              className={staffInputClass + " mt-1.5"}
            />
          </label>

          <label className="text-[10px] font-extrabold text-[#5B534C]">
            Оқушы сыйымдылығы
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className={staffInputClass + " mt-1.5"}
            />
          </label>

          {message ? <p className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[10px] font-bold text-[#B95D00]">{message}</p> : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={loading} className="h-11 rounded-[13px] border border-[#E8E1DA] bg-white px-4 text-[10px] font-extrabold text-[#6B625B]">
              Бас тарту
            </button>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Команда қосу
            </PrimaryButton>
          </div>
        </form>
      </StaffModal>
    </>
  );
}
