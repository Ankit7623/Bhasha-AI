"use client";

import { motion } from "framer-motion";
import { AudioLines, Quote } from "lucide-react";

type LiveTranscriptProps = {
  open: boolean;
  finalText: string;
  fromName: string;
};

/**
 * The panel lives in a permanently reserved slot.
 *
 * It used to be mounted/unmounted with an animated `height: 0 → auto`, which
 * pushed the typed-input form, the summary card and the action bar up and down
 * (measured ~0.6 CLS for a single translation). The slot height is now fixed
 * and only opacity/transform animate, so nothing below it can move.
 *
 * 7.5rem = 2 × 1rem padding + 2rem waveform row + 0.75rem gap + 2.75rem text.
 */
const SLOT_HEIGHT = "7.5rem";

/** Animated waveform driven purely by CSS — no audio analysis needed. */
function Waveform() {
  return (
    <div className="flex h-8 items-end justify-center gap-1">
      {[0.9, 0.5, 1, 0.65, 0.8, 0.45, 0.95].map((peak, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-blue-300 animate-eq"
          style={{
            height: `${peak * 100}%`,
            transformOrigin: "bottom",
            animationDelay: `${i * 0.09}s`,
            animationDuration: `${0.7 + (i % 3) * 0.15}s`,
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
        transition={{ duration: 0.2, ease: "easeOut" }}
        aria-hidden={!open}
        className={`glass relative flex h-full flex-col overflow-hidden rounded-2xl p-4 ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

        <div className="flex items-center gap-2">
          <Waveform />
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
            <AudioLines className="h-3 w-3" />
            Recording · {fromName}
          </span>
        </div>

        <div className="mt-3 h-11 overflow-y-auto text-left">
          {heard ? (
            <p className="text-sm leading-relaxed text-zinc-200">{finalText}</p>
          ) : (
            <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <Quote className="h-3 w-3" />
              Recording audio. Tap the mic again when you are done speaking.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
