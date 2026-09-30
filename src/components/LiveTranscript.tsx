"use client";

import { motion } from "framer-motion";
import { AudioLines, Sparkles } from "lucide-react";

type LiveTranscriptProps = {
  open: boolean;
  finalText: string;
  fromName: string;
};

const SLOT_HEIGHT = "7.5rem";

/** Animated waveform driven purely by CSS */
function Waveform() {
  return (
    <div className="flex h-7 items-end justify-center gap-1">
      {[0.85, 0.45, 1, 0.6, 0.9, 0.4, 0.95].map((peak, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-indigo-500 via-sky-400 to-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.4)] animate-eq"
          style={{
            height: `${peak * 100}%`,
            transformOrigin: "bottom",
            animationDelay: `${i * 0.09}s`,
            animationDuration: `${0.75 + (i % 3) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LiveTranscript({
  open,
  finalText,
  fromName,
}: LiveTranscriptProps) {
  const heard = finalText.trim();

  return (
    <div className="w-full" style={{ height: SLOT_HEIGHT }}>
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 6 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        aria-hidden={!open}
        className={`glass relative flex h-full flex-col overflow-hidden rounded-2xl p-4 ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

        <div className="flex items-center gap-2.5">
          <Waveform />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <AudioLines className="h-3 w-3 animate-pulse" />
            Live Recording · {fromName}
          </span>
        </div>

        <div className="mt-3 h-11 overflow-y-auto text-left">
          {heard ? (
            <p className="text-sm font-medium leading-relaxed text-slate-100">{finalText}</p>
          ) : (
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="h-3 w-3 text-sky-400" />
              Listening to speech… tap mic again when done.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
