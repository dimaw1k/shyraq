import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { AppPreferences } from "@/components/app/AppPreferences";
import { ReminderRuntime } from "@/components/app/ReminderRuntime";

// Per-request CSP nonces require dynamic rendering so Next.js can apply the
// current request nonce to its generated script tags. Static HTML cannot safely
// be served with a different nonce on each response.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF9F7",
};

export const metadata: Metadata = {
  title: "Shyraq — оқу тәртібін жүйеге айналдыр",
  description: "Shyraq — сабақ, тапсырма, прогресс және ментор бақылауын бір жерге жинайтын оқу платформасы.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <body className="min-h-screen">
        <AppPreferences />
        <ReminderRuntime />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
