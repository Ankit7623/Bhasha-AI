"use client";

import { motion } from "framer-motion";
import { AudioLines, Sprout, Sparkles, Volume2 } from "lucide-react";
import type { LangCode } from "@/lib/languages";
import { getLang } from "@/lib/languages";

export type KisaanResult = {
  question: string;
  solution: string;
  summary: string;
  langCode: LangCode;
};

type SolutionCardProps = {
  result: KisaanResult | null;
  loading: boolean;
  speaking: boolean;
  onSpeak: () => void;
};

/* ── Skeleton loader while Gemini is thinking ── */
function SolutionSkeleton() {
  return (
    <div className="glass-kisaan relative overflow-hidden rounded-3xl p-5 sm:p-6">
      {/* Top specular edge */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      <div className="flex items-center gap-2">
        <div className="h-6 w-6 animate-pulse rounded-lg bg-emerald-500/20" />
        <div className="h-4 w-48 animate-pulse rounded-lg bg-emerald-500/15" />
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-white/[0.06] bg-black/30 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-emerald-500/15 bg-emerald-900/10 p-4">
        <div className="h-3 w-32 animate-pulse rounded bg-emerald-500/15" />
        <div className="space-y-2">
          <div className="h-5 w-full animate-pulse rounded bg-emerald-500/10" />
          <div className="h-5 w-full animate-pulse rounded bg-emerald-500/10" />
          <div className="h-5 w-5/6 animate-pulse rounded bg-emerald-500/10" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-emerald-500/10" />
        </div>
      </div>

      {/* Animated shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent" />
      </div>
    </div>
  );
}

/* ── Empty state before any question ── */
function SolutionEmpty() {
  return (
    <div className="glass-kisaan flex min-h-[20rem] flex-col items-center justify-center gap-3.5 rounded-3xl p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        <Sprout className="h-7 w-7 text-emerald-300" />
      </div>
      <p className="text-base font-bold text-emerald-100">
        🌾 AI Sahayak — Ready
      </p>
      <p className="max-w-xs text-xs leading-relaxed text-emerald-300/60">
        Speak or type your farming question in any Indian language. AI Sahayak
        will give practical advice in the same language you asked in.
      </p>
    </div>
  );
}

/* ── Main Solution Card ── */
export function SolutionCard({
  result,
  loading,
  speaking,
  onSpeak,
}: SolutionCardProps) {
  if (loading) return <SolutionSkeleton />;
  if (!result) return <SolutionEmpty />;

  const lang = getLang(result.langCode);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="glass-kisaan relative overflow-hidden rounded-3xl p-5 sm:p-6"
    >
      {/* Top radiant specular edge */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

      {/* Header badge */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 shadow-sm">
          <Sprout className="h-3 w-3 text-emerald-400" />
          AI Sahayak · Kisaan Mode
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          <Sparkles className="h-2.5 w-2.5 text-amber-400" />
          Gemini AI
        </span>
      </div>

      {/* Farmer's question */}
      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/40 p-4 backdrop-blur-sm">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
          <AudioLines className="h-3 w-3 text-emerald-400" />
          Farmer&apos;s Question · {lang.native}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {result.question}
        </p>
      </div>

      {/* AI Solution */}
      <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-900/30 to-[#0c112a]/80 p-4 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300/90">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Solution · {lang.scriptName}
          </p>
        </div>
        <p className="mt-3 whitespace-pre-line text-base font-semibold leading-relaxed tracking-tight text-white text-glow-kisaan sm:text-lg">
          {result.solution}
        </p>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-black/30 p-3.5">
          <span className="mt-0.5 shrink-0 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
            सारांश
          </span>
          <p className="text-sm font-medium leading-relaxed text-slate-200">
            {result.summary}
          </p>
        </div>
      )}

      {/* Footer: TTS play button */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <p className="text-[10px] leading-relaxed text-emerald-400/60">
          🌱 Advice powered by AI — always verify with local agricultural experts
        </p>

        <motion.button
          type="button"
          onClick={onSpeak}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
            speaking
              ? "border-amber-400/60 bg-amber-500/25 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.45)]"
              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400/60 hover:bg-emerald-500/25 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]"
          }`}
        >
          <Volume2
            className={`h-4 w-4 ${speaking ? "animate-pulse text-amber-300" : "text-emerald-300"}`}
          />
          {speaking ? "बोल रहा है…" : "🔊 सुनिए (Listen)"}
        </motion.button>
      </div>
    </motion.section>
  );
}
