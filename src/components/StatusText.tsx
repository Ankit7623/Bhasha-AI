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
    label: "Recording — tap the mic to translate",
  },
  thinking: { icon: Languages, label: "Transcribing and translating…" },
  ready: { icon: Check, label: "Translation ready — play or share it" },
  denied: { icon: ShieldAlert, label: "Mic blocked — allow access to speak" },
  unsupported: {
    icon: Volume2,
    label: "Voice input unsupported — try Chrome/Edge",
  },
} as const;

export function StatusText({ mode, fromName, toName }: StatusTextProps) {
  const active = STEPS[mode] ?? STEPS.idle;
  const Icon = active.icon;
  const warn = mode === "denied" || mode === "unsupported";

  const label =
    mode === "idle" && fromName && toName
      ? `Tap the mic and speak ${fromName}`
      : active.label;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
      <motion.span
        key={mode}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={`grid h-6 w-6 place-items-center rounded-full border ${
          warn ? "border-gold/40 bg-gold/10" : "border-blue-400/30 bg-blue-500/10"
        }`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${warn ? "text-gold" : "text-blue-300"}`}
        />
      </motion.span>
      <motion.span
        key={label}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-medium"
      >
        {label}
      </motion.span>
    </div>
  );
}
