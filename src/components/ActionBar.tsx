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
        className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-white/5 text-zinc-600"
            : "border-blue-500/40 bg-blue-500/10 text-blue-200 shadow-[0_0_28px_rgba(59,130,246,0.18)] hover:bg-blue-500/20 hover:shadow-[0_0_42px_rgba(59,130,246,0.32)]"
        }`}
      >
        <MessageCircle className="h-4 w-4" />
        Share on WhatsApp
      </motion.button>

      {/* Copy text */}
      <motion.button
        type="button"
        onClick={onCopy}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-white/5 text-zinc-600"
            : copied
              ? "border-blue-400/50 bg-blue-500/15 text-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              : "border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.28)]"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Text
          </>
        )}
      </motion.button>
    </div>
  );
}
