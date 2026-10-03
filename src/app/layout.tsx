import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

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
      <body className="min-h-screen"><SmoothScroll>{children}</SmoothScroll></body>
    </html>
  );
}
