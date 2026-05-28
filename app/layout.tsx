import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "./_components/BottomNav";
import { DesktopNav } from "./_components/DesktopNav";
import { EnsureHomeFirst } from "./_components/EnsureHomeFirst";
import { HeaderMembers } from "./_components/HeaderMembers";
import { TeeOrderDice } from "./_components/TeeOrderDice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "일산골프모임",
  description: "일산골프모임 멤버들의 스코어 관리 웹 앱",
  themeColor: "#064e3b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "일산골프",
  },
};

const DEFAULT_NAMES = ["김동원", "김상우", "이문림", "신윤하"] as const;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let members: { id: number; name: string }[] = [];
  try {
    members = await prisma.member.findMany({ orderBy: { id: "asc" } });
    if (members.length < 4) {
      for (const name of DEFAULT_NAMES) {
        await prisma.member.upsert({
          where: { name },
          create: { name },
          update: {},
        });
      }
      members = await prisma.member.findMany({ orderBy: { id: "asc" } });
    }
    members = members.slice(0, 4);
  } catch {
    members = DEFAULT_NAMES.map((name, i) => ({ id: i + 1, name }));
  }

  return (
    <html lang="ko">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-emerald-950 text-emerald-50`}
      >
        <div className="flex min-h-[100dvh] w-full justify-center safe-area-root">
          <div className="relative flex min-h-[100dvh] w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl flex-col bg-gradient-to-b from-emerald-950 via-emerald-950 to-emerald-900 md:rounded-none lg:shadow-2xl lg:shadow-emerald-950/50 lg:min-h-0 lg:my-4 lg:max-h-[calc(100dvh-2rem)] lg:rounded-2xl lg:border lg:border-emerald-800/60 lg:overflow-hidden">
            <header className="app-header sticky top-0 z-30 border-b border-emerald-900/60 bg-gradient-to-b from-emerald-950/95 to-emerald-950/80 px-4 py-5 md:px-6 md:py-6 backdrop-blur-md safe-area-top">
              <div className="app-header-inner flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="[&>*]:my-0 flex flex-col gap-0.5">
                  <p className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                    Ilsan Golf Crew
                  </p>
                  <TeeOrderDice members={members} />
                  <HeaderMembers members={members} />
                </div>
                <DesktopNav />
              </div>
            </header>
            <EnsureHomeFirst />
            <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 pt-4 md:px-6 md:pb-12 md:pt-6">{children}</main>
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
