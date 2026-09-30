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
  idle: "border border-blue-400/35 bg-gradient-to-b from-blue-500/20 to-blue-600/5 text-blue-300 shadow-[0_0_50px_rgba(59,130,246,0.25)] hover:shadow-[0_0_75px_rgba(59,130,246,0.45)]",
  listening:
    "ring-glow-neon bg-gradient-to-b from-blue-400 to-blue-700 text-white",
  thinking:
    "border border-blue-400/40 bg-gradient-to-b from-blue-500/20 to-blue-500/5 text-blue-200 shadow-[0_0_45px_rgba(59,130,246,0.25)]",
  denied:
    "border border-rose-400/40 bg-gradient-to-b from-rose-500/15 to-rose-500/5 text-rose-300 shadow-[0_0_40px_rgba(244,63,94,0.2)]",
  unsupported: "border border-zinc-600/40 bg-zinc-800/40 text-zinc-500",
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
            <span className="absolute h-44 w-44 rounded-full border-2 border-blue-400/60 animate-pulse-ring" />
            <span className="absolute h-44 w-44 rounded-full border-2 border-blue-400/50 animate-pulse-ring-slow" />
            <span className="absolute h-44 w-44 rounded-full bg-blue-500/10 blur-2xl" />
          </>
        ) : (
          !blocked && (
            <span className="absolute h-44 w-44 rounded-full border border-blue-400/20 animate-pulse-ring-slow" />
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
        className={`relative grid h-36 w-36 place-items-center rounded-full transition-all duration-300 ${STYLES[state]}`}
      >
        {/* Rotating conic halo — only while actively listening */}
        {listening && (          <span
                className="pointer-events-none absolute -inset-1 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(59,130,246,0.55)_60deg,transparent_140deg,rgba(37,99,235,0.5)_240deg,transparent_320deg)] blur-[10px] [animation-duration:3s]"
              />
        )}

        {listening ? (
          <span className="relative z-10 flex items-end gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-white/80 animate-eq"
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
            className="relative z-10 h-11 w-11 animate-spin"
            strokeWidth={1.7}
          />
        ) : state === "denied" ? (
          <MicOff className="relative z-10 h-12 w-12" strokeWidth={1.8} />
        ) : state === "unsupported" ? (
          <Ban className="relative z-10 h-10 w-10" strokeWidth={1.8} />
        ) : (
          <Mic className="relative z-10 h-14 w-14" strokeWidth={1.7} />
        )}
      </motion.button>

      {blocked && (
        <p className="mt-3 max-w-64 text-center text-xs leading-relaxed text-zinc-500">
          {state === "denied"
            ? "Microphone blocked — allow access in your browser settings to translate by voice."
            : "Audio recording isn't supported in this browser — try Chrome, Edge or Safari."}
        </p>
      )}
    </div>
  );
}
