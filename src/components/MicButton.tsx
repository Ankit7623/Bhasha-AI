"use client";

import { motion } from "framer-motion";
import { Ban, Loader2, Mic, MicOff } from "lucide-react";

export type MicState =
  | "idle"
  | "listening"
  | "thinking"
  | "denied"
  | "unsupported";

type MicButtonProps = {
  state: MicState;
  onToggle: () => void;
};

const STYLES: Record<MicState, string> = {
  idle: "border border-indigo-400/30 bg-gradient-to-b from-indigo-500/20 via-blue-600/10 to-[#070c22]/80 text-sky-200 shadow-[0_0_50px_rgba(99,102,241,0.25)] hover:border-indigo-400/50 hover:shadow-[0_0_75px_rgba(99,102,241,0.45)] hover:text-white",
  listening:
    "ring-glow-neon bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-700 text-white shadow-[0_0_60px_rgba(59,130,246,0.55)]",
  thinking:
    "border border-indigo-400/40 bg-gradient-to-b from-indigo-500/25 via-blue-500/15 to-[#0a0f2c] text-indigo-200 shadow-[0_0_50px_rgba(99,102,241,0.3)]",
  denied:
    "border border-rose-500/40 bg-gradient-to-b from-rose-500/20 via-rose-600/10 to-[#1a0c14] text-rose-300 shadow-[0_0_40px_rgba(244,63,94,0.25)]",
  unsupported:
    "border border-slate-700/40 bg-[#0d1222]/80 text-slate-500 shadow-none",
};

export function MicButton({ state, onToggle }: MicButtonProps) {
  const listening = state === "listening";
  const busy = state === "thinking";
  const blocked = state === "denied" || state === "unsupported";

  return (
    <div className="relative flex flex-col items-center">
      {/* Pulsing rings behind the mic */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        {listening ? (
          <>
            <span className="absolute h-44 w-44 rounded-full border-2 border-sky-400/60 animate-pulse-ring" />
            <span className="absolute h-44 w-44 rounded-full border-2 border-indigo-500/50 animate-pulse-ring-slow" />
            <span className="absolute h-44 w-44 rounded-full bg-blue-500/15 blur-2xl" />
          </>
        ) : (
          !blocked && (
            <span className="absolute h-44 w-44 rounded-full border border-indigo-400/20 animate-pulse-ring-slow" />
          )
        )}
      </div>

      <motion.button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-pressed={listening}
        aria-label={
          state === "denied"
            ? "Microphone blocked"
            : state === "unsupported"
              ? "Audio recording unsupported"
              : busy
                ? "Translating"
                : listening
                  ? "Stop listening"
                  : "Start voice translation"
        }
        whileTap={blocked || busy ? undefined : { scale: 0.93 }}
        whileHover={blocked || busy ? undefined : { scale: 1.03 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className={`relative grid h-36 w-36 place-items-center rounded-full backdrop-blur-xl transition-all duration-300 ${STYLES[state]}`}
      >
        {/* Rotating conic halo — only while actively listening */}
        {listening && (
          <span
            className="pointer-events-none absolute -inset-1.5 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(56,189,248,0.7)_60deg,transparent_140deg,rgba(99,102,241,0.7)_240deg,transparent_320deg)] blur-[10px] [animation-duration:2.8s]"
          />
        )}

        {listening ? (
          <span className="relative z-10 flex items-end gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-white/90 shadow-[0_0_10px_white] animate-eq"
                style={{
                  height: "2.25rem",
                  transformOrigin: "bottom",
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </span>
        ) : busy ? (
          <Loader2
            className="relative z-10 h-12 w-12 animate-spin text-indigo-300"
            strokeWidth={1.8}
          />
        ) : state === "denied" ? (
          <MicOff className="relative z-10 h-12 w-12" strokeWidth={1.8} />
        ) : state === "unsupported" ? (
          <Ban className="relative z-10 h-10 w-10" strokeWidth={1.8} />
        ) : (
          <Mic className="relative z-10 h-14 w-14 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]" strokeWidth={1.75} />
        )}
      </motion.button>

      {blocked && (
        <p className="mt-3 max-w-64 text-center text-xs leading-relaxed text-slate-400">
          {state === "denied"
            ? "Microphone blocked — allow access in your browser settings to translate by voice."
            : "Audio recording isn't supported in this browser — try Chrome, Edge or Safari."}
        </p>
      )}
    </div>
  );
}
