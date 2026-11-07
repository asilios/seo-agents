import type { Metadata, Viewport } from "next";
import "./globals.css";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.app, robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
