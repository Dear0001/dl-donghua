import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "AniFrame — Discover your next anime", template: "%s | AniFrame" },
  description: "Discover anime, explore episodes, and keep your personal watchlist close.",
  openGraph: {
    title: "AniFrame — Discover your next anime",
    description: "Discover anime, explore episodes, and keep your personal watchlist close.",
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "AniFrame",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <Providers><AppShell>{children}</AppShell></Providers>
      </body>
    </html>
  );
}
