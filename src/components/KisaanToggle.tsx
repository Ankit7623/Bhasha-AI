"use client";

import { motion } from "framer-motion";
import { Sprout } from "lucide-react";

type KisaanToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function KisaanToggle({
  enabled,
  onToggle,
  disabled = false,
}: KisaanToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full"
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={enabled}
        id="kisaan-mode-toggle"
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${
          enabled
            ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/15 via-emerald-600/10 to-amber-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            : "border-white/[0.08] bg-black/30 hover:border-white/[0.12] hover:bg-black/40"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {/* Left: icon + label */}
        <div className="flex items-center gap-3">
          <div
            className={`grid h-8 w-8 place-items-center rounded-xl transition-all duration-500 ${
              enabled
                ? "bg-gradient-to-br from-emerald-500/30 to-amber-500/20 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                : "bg-white/[0.06]"
            }`}
          >
            <Sprout
              className={`h-4 w-4 transition-colors duration-300 ${
                enabled ? "text-emerald-300" : "text-slate-400"
              }`}
            />
          </div>
          <div className="flex flex-col items-start">
            <span
              className={`text-sm font-bold tracking-tight transition-colors duration-300 ${
                enabled ? "text-emerald-100" : "text-slate-200"
              }`}
            >
              🌾 Kisaan Mode
            </span>
            <span
              className={`text-[10px] font-medium transition-colors duration-300 ${
                enabled ? "text-emerald-300/70" : "text-slate-500"
              }`}
            >
              {enabled
                ? "AI Sahayak is listening for farming questions"
                : "Ask farming questions in your language"}
            </span>
          </div>
        </div>

        {/* Right: toggle track + thumb */}
        <div
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-500 ${
            enabled
              ? "border-emerald-400/50 bg-gradient-to-r from-emerald-600/60 to-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              : "border-white/[0.12] bg-white/[0.06]"
          }`}
        >
          <motion.div
            animate={{ x: enabled ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`absolute top-[3px] h-5 w-5 rounded-full shadow-md transition-colors duration-300 ${
              enabled
                ? "bg-gradient-to-br from-amber-300 to-emerald-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                : "bg-slate-400"
            }`}
          />
        </div>
      </button>
    </motion.div>
  );
}
