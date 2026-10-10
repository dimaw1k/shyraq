"use client";

import { useEffect, useRef, useState } from "react";

export default function RecoveryCallbackPage() {
  const started = useRef(false);
  const [message, setMessage] = useState("Қалпына келтіру сілтемесі тексеріліп жатыр…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function exchangeRecoveryToken() {
      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const type = params.get("type");

      // Remove sensitive tokens from the visible URL/history before network work.
      window.history.replaceState(
        window.history.state,
        "",
        currentUrl.pathname + currentUrl.search,
      );

      if (!accessToken || type !== "recovery") {
        window.location.replace("/reset-password?error=invalid_or_expired");
        return;
      }

      try {
        const response = await fetch("/api/auth/recovery/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ accessToken, type }),
        });

        if (!response.ok) {
          window.location.replace("/reset-password?error=invalid_or_expired");
          return;
        }

        window.location.replace("/reset-password?mode=update");
      } catch {
        setMessage(
          "Сілтемені тексеру кезінде байланыс қатесі болды. Қалпына келтіру хатын қайта сұраңыз.",
        );
      }
    }

    void exchangeRecoveryToken();
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#FAF9F7] px-4 py-8 text-[#172235]">
      <section
        aria-live="polite"
        className="w-full max-w-[430px] rounded-[26px] border border-[#E7E0D8] bg-white px-6 py-8 text-center shadow-[0_20px_55px_rgba(23,34,53,.06)]"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] border border-[#E8E1D8] bg-[#FFF7F1] text-[#FF8000]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6 animate-pulse"
            fill="none"
          >
            <path
              d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-extrabold">Құпиясөзді қалпына келтіру</h1>
        <p className="mt-3 text-sm leading-6 text-[#766E66]">{message}</p>
      </section>
    </main>
  );
}
