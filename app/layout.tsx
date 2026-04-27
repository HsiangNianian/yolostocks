import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { LocaleBoot } from "@/components/LocaleBoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOLO Agent",
  description: "A browser-native agent trading roguelike built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <LocaleBoot />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
