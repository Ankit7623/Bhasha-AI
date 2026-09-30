import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhasha AI — Universal Indic Voice Translator",
  description:
    "Speak in any of 12+ Indian languages and hear it instantly in another — native script, Roman transliteration and voice playback. Bhasha AI, the Universal Indic Voice Agent.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-slate-navy">
      <body className="min-h-dvh bg-slate-navy text-zinc-100">{children}</body>
    </html>
  );
}
