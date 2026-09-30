"use client";

import { Globe2, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.11em] text-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.28)] sm:text-[9px]">
              <Sparkles className="h-2.5 w-2.5 shrink-0" />
              Universal Indic Voice Agent
            </span>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-400/25 bg-blue-500/8 px-2 py-1.5 text-[10px] font-bold text-blue-200 sm:px-2.5">
          <Globe2 className="h-3.5 w-3.5 text-cyan-glow" />
          12+<span className="hidden sm:inline"> भाषाएँ</span>
        </span>
      </div>
    </header>
  );
}
