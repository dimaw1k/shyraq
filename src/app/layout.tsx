import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export const metadata: Metadata = {
  title: "Shyraq — оқу тәртібін жүйеге айналдыр",
  description: "Shyraq — сабақ, тапсырма, прогресс және ментор бақылауын бір жерге жинайтын оқу платформасы.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <body><SmoothScroll>{children}</SmoothScroll></body>
    </html>
  );
}
