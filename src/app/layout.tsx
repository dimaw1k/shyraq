import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export const viewport: Viewport = {\n  width: "device-width",\n  initialScale: 1,\n  viewportFit: "cover",\n  themeColor: "#FAF9F7",\n};\n\nexport const metadata: Metadata = {
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
