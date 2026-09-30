"use client";

import { Globe2, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050814]/80 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 py-3.5">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          {/* Logo Squircle */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 p-0.5 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-1 ring-white/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#070b1e]/90 font-bold text-white">
              <span className="bg-gradient-to-r from-blue-200 via-white to-sky-200 bg-clip-text text-base font-extrabold text-transparent">
                भा
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-lg font-black tracking-tight text-transparent">
                भाषा <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">AI</span>
              </h1>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-slate-400">
              Universal Indic Voice Agent
            </span>
          </div>
        </div>

        {/* Badges / Metrics */}
        <div className="flex items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Globe2 className="h-3.5 w-3.5 text-sky-400" />
            12+ <span className="text-slate-300 font-normal">भाषाएँ</span>
          </span>
        </div>
      </div>
    </header>
  );
}
