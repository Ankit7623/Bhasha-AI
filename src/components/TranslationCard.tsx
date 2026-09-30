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
  /** Live in-flight preview of what the mic is hearing */
  preview?: boolean;
  speaking: boolean;
  onPlay: () => void;
};

function EngineBadge({ engine }: { engine: TranslationEngine }) {
  const label =
    engine === "gemini"
      ? "Gemini live"
      : engine === "mymemory"
        ? "MyMemory online"
        : "Offline";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
        engine === "gemini"
          ? "border-blue-400/40 bg-blue-500/10 text-blue-300"
          : engine === "mymemory"
            ? "border-blue-400/30 bg-blue-500/10 text-blue-200"
            : "border-white/10 bg-white/5 text-zinc-400"
      }`}
    >
      {engine === "gemini" ? (
        <Sparkles className="h-2.5 w-2.5" />
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
    // min-h matches the height of the card box in TranslatorApp, so the empty
    // state and a filled card occupy the same space (no shift when a card lands).
    return (
      <div className="glass flex min-h-[32rem] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
          <Speech className="h-6 w-6 text-zinc-500" />
        </div>
        <p className="text-sm font-semibold text-zinc-300">
          Nothing translated yet
        </p>
        <p className="max-w-60 text-xs leading-relaxed text-zinc-500">
          Tap the mic, speak in your language — Bhasha AI shows the original
          voice input, the translation in native script, and its Roman reading.
        </p>
      </div>
    );
  }

  const from = getLang(result.from);
  const to = getLang(result.to);

  return (
    <motion.section
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: preview ? 0.72 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6"
    >
      {/* Top neon edge */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />

      {/* Header: language pair + engine */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-950/60 bg-blue-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
          <Languages className="h-3 w-3 text-blue-300" />
          {from.english}
          <span className="text-zinc-600">→</span>
          <span className="text-blue-300">{to.english}</span>
        </span>
        <EngineBadge engine={result.engine} />
      </div>

      {/* Original voice input */}
      <div className="mt-5 rounded-2xl border border-white/8 bg-black/40 p-3.5">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          <AudioLines className="h-3 w-3 text-blue-400" />
          Original voice input · {from.native}
        </p>
        <p
          className={`mt-1.5 text-sm leading-relaxed text-zinc-200 ${
            preview ? "italic" : ""
          }`}
        >
          {result.original}
        </p>
        {result.originalTransliteration &&
          result.originalTransliteration !== result.original && (
            <p className="mt-1 text-[11px] text-zinc-500">
              {result.originalTransliteration}
            </p>
          )}
      </div>

      {/* Translation in native script */}
      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          <Sparkles className="h-3 w-3 text-blue-400" />
          Translated · {to.scriptName}
        </p>          <p className="text-glow-neon mt-1.5 text-2xl font-bold leading-snug tracking-tight text-blue-200 sm:text-3xl">
          {result.translated}
        </p>
      </div>

      {/* Transliteration */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-3.5">
        <span className="mt-0.5 shrink-0 rounded-md border border-blue-500/25 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300">
          Roman
        </span>
        <p className="text-sm leading-relaxed text-blue-100/90">
          {result.transliteration || "—"}
        </p>
      </div>

      {/* Footer: meta + play audio */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-blue-500/10 pt-4">
        <div className="min-w-0">
          {result.detectedSourceLanguage && (
            <p className="text-[11px] text-zinc-500">
              Detected:{" "}
              <span className="text-zinc-300">
                {result.detectedSourceLanguage}
              </span>
            </p>
          )}
          {result.note && (
            <p className="mt-0.5 max-w-56 text-[10px] leading-relaxed text-zinc-600">
              {result.note}
            </p>
          )}
        </div>

        <motion.button
          type="button"
          onClick={onPlay}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
            speaking
              ? "border-blue-400/50 bg-blue-500/20 text-blue-200 shadow-[0_0_26px_rgba(59,130,246,0.35)]"
              : "border-blue-400/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:shadow-[0_0_26px_rgba(59,130,246,0.3)]"
          }`}
        >
          <Volume2
            className={`h-3.5 w-3.5 ${speaking ? "animate-pulse" : ""}`}
          />
          {speaking ? "Speaking…" : "Play Audio Voice"}
        </motion.button>
      </div>
    </motion.section>
  );
}
