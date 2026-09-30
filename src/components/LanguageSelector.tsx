"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ChevronDown,
  Languages,
  Mic2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  getLang,
  langOptionLabel,
  LANGUAGES,
  type LangCode,
} from "@/lib/languages";

type LanguageSelectorProps = {
  from: LangCode;
  to: LangCode;
  onFromChange: (code: LangCode) => void;
  onToChange: (code: LangCode) => void;
  onSwap: () => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  disabled?: boolean;
};

type FieldProps = {
  label: string;
  icon: React.ReactNode;
  value: LangCode;
  onChange: (code: LangCode) => void;
  disabled?: boolean;
};

function LanguageField({
  label,
  icon,
  value,
  onChange,
  disabled,
}: FieldProps) {
  const lang = getLang(value);
  const ring =
    "focus-within:border-indigo-400/60 focus-within:shadow-[0_0_24px_rgba(99,102,241,0.25)] focus-within:bg-[#0c1228]/80";

  return (
    <label
      className={`group flex flex-1 items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 backdrop-blur-md transition-all duration-300 hover:border-white/15 ${ring} ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-[#101633]/60 shadow-inner">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-300/90">
          {label}
        </span>
        <span className="relative mt-0.5 flex items-center">
          <select
            value={value}
            disabled={disabled}
            aria-label={label}
            onChange={(e) => onChange(e.target.value as LangCode)}
            className="w-full cursor-pointer appearance-none truncate bg-transparent pr-5 text-sm font-semibold text-slate-100 outline-none [&>option]:bg-[#0f172a] [&>option]:text-slate-100"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {langOptionLabel(l.code)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-0 h-4 w-4 text-indigo-300/70"
          />
        </span>
      </span>

      <span className="hidden shrink-0 rounded-full border border-white/[0.08] bg-[#101633]/50 px-2 py-0.5 text-[9px] font-medium text-slate-400 sm:block">
        {lang.scriptName}
      </span>
    </label>
  );
}

export function LanguageSelector({
  from,
  to,
  onFromChange,
  onToChange,
  onSwap,
  autoSpeak,
  onToggleAutoSpeak,
  disabled,
}: LanguageSelectorProps) {
  return (
    <section className="glass relative overflow-hidden rounded-3xl p-3.5 sm:p-4">
      {/* Subtle top specular shimmer line */}
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <LanguageField
          label="I Speak"
          icon={<Mic2 className="h-4 w-4 text-sky-400" />}
          value={from}
          onChange={onFromChange}
          disabled={disabled}
        />

        {/* Swap button */}
        <div className="flex items-center gap-3 sm:gap-0">
          <span className="h-px flex-1 bg-white/[0.06] sm:hidden" />
          <motion.button
            type="button"
            onClick={onSwap}
            whileTap={{ scale: 0.88 }}
            whileHover={{ rotate: 180 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            aria-label="Swap languages"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300 hover:border-indigo-400/60 hover:bg-indigo-500/20 hover:shadow-[0_0_28px_rgba(99,102,241,0.35)]"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </motion.button>
          <span className="h-px flex-1 bg-white/[0.06] sm:hidden" />
        </div>

        <LanguageField
          label="Translate To"
          icon={<Languages className="h-4 w-4 text-amber-400" />}
          value={to}
          onChange={onToChange}
          disabled={disabled}
        />
      </div>

      {/* Footer row: script hint + auto-speak toggle */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
          {getLang(from).english} <span className="text-indigo-400">→</span> {getLang(to).english}
        </p>

        <button
          type="button"
          onClick={onToggleAutoSpeak}
          aria-pressed={autoSpeak}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
            autoSpeak
              ? "border-amber-400/40 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:bg-amber-500/15"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-300"
          }`}
        >
          {autoSpeak ? (
            <Volume2 className="h-3 w-3 text-amber-400" />
          ) : (
            <VolumeX className="h-3 w-3" />
          )}
          Auto-speak {autoSpeak ? "on" : "off"}
        </button>
      </div>
    </section>
  );
}
