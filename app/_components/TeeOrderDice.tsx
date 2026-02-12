"use client";

import { useState, useCallback, useEffect } from "react";

type Member = { id: number; name: string };

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const CONFETTI_COLORS = [
  "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24", "#f59e0b",
  "#f97316", "#fb923c", "#ec4899", "#f472b6", "#a78bfa", "#c4b5fd",
];

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: 70 }, (_, i) => {
      const angle = (i / 70) * 2 * Math.PI + Math.random() * 0.5;
      const dist = 80 + Math.random() * 120;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist - 50;
      return {
        id: i,
        x: `${x}vw`,
        y: `${y}vh`,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 0.2,
        duration: 1.2 + Math.random() * 0.6,
        rotation: 360 + Math.random() * 360,
      };
    }),
  );

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-sm opacity-90"
          style={{
            "--cf-x": p.x,
            "--cf-y": p.y,
            "--cf-rot": `${p.rotation}deg`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animation: `confetti-fly ${p.duration}s ease-out ${p.delay}s forwards`,
            transform: "translate(-50%, -50%)",
            opacity: 0,
            boxShadow: "0 0 6px rgba(255,255,255,0.4)",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function TeeOrderDice({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const openAndShuffle = useCallback(() => {
    const names = members.map((m) => m.name);
    setOrder(names.length > 0 ? shuffle(names) : []);
    setOpen(true);
    setShowConfetti(true);
  }, [members]);

  const reshuffle = useCallback(() => {
    const names = members.map((m) => m.name);
    setOrder(names.length > 0 ? shuffle(names) : []);
    setShowConfetti(true);
  }, [members]);

  const confettiDone = useCallback(() => setShowConfetti(false), []);

  return (
    <>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-emerald-50">
          일산골프모임
        </h1>
        <button
          type="button"
          onClick={openAndShuffle}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-xl transition hover:opacity-80 focus:opacity-80 focus:outline-none"
          aria-label="티샷 순서 뽑기"
        >
          <span aria-hidden>🎲</span>
        </button>
      </div>

      {showConfetti && <ConfettiBurst onDone={confettiDone} />}

      {open && (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="티샷 순서"
        >
          <div className="mx-auto w-full max-w-sm shrink-0 rounded-2xl border border-emerald-700/80 bg-gradient-to-b from-emerald-950 to-emerald-900 p-5 shadow-2xl">
            <p className="text-center text-xs font-semibold tracking-widest text-emerald-400">
              오늘의 티샷 순서
            </p>
            <ul className="mt-4 space-y-2">
              {order.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="flex items-center gap-3 rounded-xl bg-emerald-800/60 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-emerald-950">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-emerald-50">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={reshuffle}
                className="flex-1 rounded-xl border border-emerald-600 bg-emerald-800/80 py-2.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-700/80"
              >
                다시 뽑기
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-500"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
