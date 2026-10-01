import type { Metadata } from "next";
import { Geologica, Manrope, Montserrat } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

const manrope = Manrope({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-manrope",
  display: "swap",
});

const geologica = Geologica({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-geologica",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shyraq — оқу тәртібін жүйеге айналдыр",
  description: "Shyraq — сабақ, тапсырма, прогресс және ментор бақылауын бір жерге жинайтын оқу платформасы.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk" className={`${montserrat.variable} ${manrope.variable} ${geologica.variable}`}>
      <body><SmoothScroll>{children}</SmoothScroll></body>
    </html>
  );
}
