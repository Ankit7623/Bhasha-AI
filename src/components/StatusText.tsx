"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  Check,
  Languages,
  Mic,
  ShieldAlert,
  Volume2,
} from "lucide-react";

export type Mode =
  | "idle"
  | "listening"
  | "thinking"
  | "ready"
  | "denied"
  | "unsupported";

type StatusTextProps = {
  mode: Mode;
  fromName?: string;
  toName?: string;
};

const STEPS = {
  idle: { icon: Mic, label: "Tap the mic and speak" },
  listening: {
    icon: AudioLines,
    label: "Listening… tap mic to finish & translate",
  },
  thinking: { icon: Languages, label: "Transcribing and translating…" },
  ready: { icon: Check, label: "Translation complete — tap play or share" },
  denied: { icon: ShieldAlert, label: "Mic blocked — allow access to speak" },
  unsupported: {
    icon: Volume2,
    label: "Voice input unsupported in this browser",
  },
} as const;

export function StatusText({ mode, fromName, toName }: StatusTextProps) {
  const active = STEPS[mode] ?? STEPS.idle;
  const Icon = active.icon;
  const warn = mode === "denied" || mode === "unsupported";
  const isListening = mode === "listening";
  const isReady = mode === "ready";

  const label =
    mode === "idle" && fromName && toName
      ? `Tap the mic to speak in ${fromName}`
      : active.label;

  return (
    <div className="flex items-center justify-center gap-2.5 text-sm text-slate-300">
      <motion.span
        key={mode}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
        className={`grid h-6 w-6 place-items-center rounded-full border shadow-sm ${
          warn
            ? "border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            : isListening
              ? "border-sky-400/60 bg-sky-500/20 text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.4)] animate-pulse"
              : isReady
                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.3)]"
                : "border-indigo-400/30 bg-indigo-500/10 text-indigo-300"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </motion.span>
      <motion.span
        key={label}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-medium tracking-wide ${
          isListening ? "text-sky-200" : isReady ? "text-emerald-200" : "text-slate-300"
        }`}
      >
        {label}
      </motion.span>
    </div>
  );
}
