import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shyraq",
  description: "Shyraq Marathon Platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <body>{children}</body>
    </html>
  );
}
