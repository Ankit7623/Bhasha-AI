"use client";

import { motion } from "framer-motion";
import { Check, Copy, MessageCircle } from "lucide-react";

type ActionBarProps = {
  disabled: boolean;
  copied: boolean;
  onShare: () => void;
  onCopy: () => void;
};

export function ActionBar({ disabled, copied, onShare, onCopy }: ActionBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Share on WhatsApp */}
      <motion.button
        type="button"
        onClick={onShare}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        className={`flex items-center justify-center gap-2.5 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed border-white/[0.05] bg-white/[0.02] text-slate-600"
            : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.15)] hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-100 hover:shadow-[0_0_36px_rgba(16,185,129,0.3)]"
        }`}
      >
        <MessageCircle className="h-4 w-4 text-emerald-400" />
        Share on WhatsApp
      </motion.button>

      {/* Copy text */}
      <motion.button
        type="button"
        onClick={onCopy}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        className={`flex items-center justify-center gap-2.5 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed border-white/[0.05] bg-white/[0.02] text-slate-600"
            : copied
              ? "border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-[0_0_30px_rgba(56,189,248,0.35)]"
              : "border-indigo-400/30 bg-indigo-500/10 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-400/50 hover:bg-indigo-500/20 hover:text-white hover:shadow-[0_0_32px_rgba(99,102,241,0.3)]"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-sky-300" />
            Copied to Clipboard!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-indigo-300" />
            Copy Translation
          </>
        )}
      </motion.button>
    </div>
  );
}
