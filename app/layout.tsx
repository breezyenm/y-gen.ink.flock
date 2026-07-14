import type { Metadata } from "next";
import { DM_Mono, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// Weights are trimmed to what this single screen renders (regular text in
// all three families); add weights here if new surfaces need them.
const shippori = Shippori_Mincho_B1({
  variable: "--font-shippori",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ink Flock — Yūgen 幽玄",
  description:
    "Move — they follow. Click — they scatter. An interactive ink flock in three scenes: birds, koi, safari.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${shippori.variable} ${zenKaku.variable} ${dmMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
