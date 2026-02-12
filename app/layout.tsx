import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "./_components/BottomNav";
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
};

const DEFAULT_NAMES = ["김동원", "김상우", "이문림", "신윤하"] as const;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let members = await prisma.member.findMany({ orderBy: { id: "asc" } });
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

  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-emerald-950 text-emerald-50`}
      >
        <div className="flex min-h-screen w-full justify-center">
          <div className="relative flex min-h-screen w-full max-w-md flex-col bg-gradient-to-b from-emerald-950 via-emerald-950 to-emerald-900">
            <header className="sticky top-0 z-10 border-b border-emerald-900/60 bg-gradient-to-b from-emerald-950/95 to-emerald-950/80 px-4 pb-3 pt-5 backdrop-blur-md">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                Ilsan Golf Crew
              </p>
              <TeeOrderDice members={members} />
              <HeaderMembers members={members} />
            </header>
            <main className="flex-1 px-4 pb-20 pt-4">{children}</main>
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
