"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  Cloud,
  Languages,
  Speech,
  Sparkles,
  Volume2,
} from "lucide-react";
import type { TranslationEngine, TranslationResult } from "@/lib/agent";
import { getLang } from "@/lib/languages";

type TranslationCardProps = {
  result: TranslationResult | null;
  preview?: boolean;
  speaking: boolean;
  onPlay: () => void;
};

function EngineBadge({ engine }: { engine: TranslationEngine }) {
  const label =
    engine === "gemini"
      ? "Gemini 2.5 Flash"
      : engine === "mymemory"
        ? "MyMemory Online"
        : "Offline Cache";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
        engine === "gemini"
          ? "border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-indigo-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
          : engine === "mymemory"
            ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
            : "border-white/10 bg-white/5 text-slate-400"
      }`}
    >
      {engine === "gemini" ? (
        <Sparkles className="h-2.5 w-2.5 text-amber-400" />
      ) : (
        <Cloud className="h-2.5 w-2.5" />
      )}
      {label}
    </span>
  );
}

export function TranslationCard({
  result,
  preview = false,
  speaking,
  onPlay,
}: TranslationCardProps) {
  if (!result) {
    return (
      <div className="glass flex min-h-[32rem] flex-col items-center justify-center gap-3.5 rounded-3xl p-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-[#101633]/60 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <Speech className="h-7 w-7 text-indigo-300" />
        </div>
        <p className="text-base font-bold text-slate-100">
          Ready for your voice
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-slate-400">
          Tap the mic, speak in any Indian language — Bhasha AI instantly displays native script, Roman transliteration, and speaks the output aloud.
        </p>
      </div>
    );
  }

  const from = getLang(result.from);
  const to = getLang(result.to);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: preview ? 0.72 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6"
    >
      {/* Top radiant specular edge */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />

      {/* Header: language pair + engine badge */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/25 bg-[#0f1535]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200 shadow-sm">
          <Languages className="h-3 w-3 text-sky-400" />
          {from.english}
          <span className="text-indigo-400">→</span>
          <span className="text-amber-300 font-extrabold">{to.english}</span>
        </span>
        <EngineBadge engine={result.engine} />
      </div>

      {/* Original voice input */}
      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/40 p-4 backdrop-blur-sm">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
          <AudioLines className="h-3 w-3 text-sky-400" />
          Original Voice · {from.native}
        </p>
        <p
          className={`mt-2 text-sm leading-relaxed text-slate-200 ${
            preview ? "italic" : ""
          }`}
        >
          {result.original}
        </p>
        {result.originalTransliteration &&
          result.originalTransliteration !== result.original && (
            <p className="mt-1 text-[11px] text-slate-400">
              {result.originalTransliteration}
            </p>
          )}
      </div>

      {/* Translation in native script */}
      <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-[#101738]/80 to-[#0c112a]/80 p-4 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-300/90">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Translated · {to.scriptName}
          </p>
        </div>
        <p className="mt-2 text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl text-glow-neon">
          {result.translated}
        </p>
      </div>

      {/* Roman Transliteration */}
      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-black/30 p-3.5">
        <span className="mt-0.5 shrink-0 rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
          Roman
        </span>
        <p className="text-sm font-medium leading-relaxed text-slate-200">
          {result.transliteration || "—"}
        </p>
      </div>

      {/* Footer: meta + play audio voice */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <div className="min-w-0">
          {result.detectedSourceLanguage && (
            <p className="text-[11px] text-slate-400">
              Detected:{" "}
              <span className="font-semibold text-slate-200">
                {result.detectedSourceLanguage}
              </span>
            </p>
          )}
          {result.note && (
            <p className="mt-0.5 max-w-56 text-[10px] leading-relaxed text-slate-500">
              {result.note}
            </p>
          )}
        </div>

        <motion.button
          type="button"
          onClick={onPlay}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
            speaking
              ? "border-sky-400/60 bg-sky-500/25 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.45)]"
              : "border-indigo-400/35 bg-indigo-500/15 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:border-indigo-400/60 hover:bg-indigo-500/25 hover:shadow-[0_0_30px_rgba(99,102,241,0.35)]"
          }`}
        >
          <Volume2
            className={`h-4 w-4 ${speaking ? "animate-pulse text-sky-300" : "text-indigo-300"}`}
          />
          {speaking ? "Speaking…" : "Play Audio Voice"}
        </motion.button>
      </div>
    </motion.section>
  );
}
