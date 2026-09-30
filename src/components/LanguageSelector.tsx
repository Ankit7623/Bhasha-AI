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
  onChange: (code: LangCode) => void;  disabled?: boolean;
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
    "focus-within:border-blue-400/60 focus-within:shadow-[0_0_26px_rgba(59,130,246,0.28)]";

  return (
    <label
      className={`group flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition-all duration-300 ${ring} ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/40">
        {icon}
      </span>        <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
          {label}
        </span>
        <span className="relative mt-0.5 flex items-center">
          <select
            value={value}
            disabled={disabled}
            aria-label={label}
            onChange={(e) => onChange(e.target.value as LangCode)}
            className="w-full cursor-pointer appearance-none truncate bg-transparent pr-5 text-sm font-bold text-white outline-none [&>option]:bg-slate-navy-2 [&>option]:text-blue-100"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {langOptionLabel(l.code)}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`pointer-events-none absolute right-0 h-4 w-4 text-blue-400`}
          />
        </span>
      </span>

      <span className="hidden shrink-0 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] font-semibold text-zinc-400 sm:block">
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
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <LanguageField
          label="I Speak"
          icon={<Mic2 className="h-4 w-4 text-blue-300" />}
          value={from}
          onChange={onFromChange}
          disabled={disabled}
        />

        {/* Swap — divider on mobile, inline on desktop */}
        <div className="flex items-center gap-3 sm:gap-0">
          <span className="h-px flex-1 bg-white/10 sm:hidden" />
          <motion.button
            type="button"
            onClick={onSwap}
            whileTap={{ scale: 0.86 }}
            whileHover={{ rotate: 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            aria-label="Swap languages"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-blue-400/40 bg-blue-500/10 text-blue-300 shadow-[0_0_22px_rgba(59,130,246,0.3)] transition-colors hover:bg-blue-500/20"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </motion.button>
          <span className="h-px flex-1 bg-white/10 sm:hidden" />
        </div>

        <LanguageField
          label="Translate To"
          icon={<Languages className="h-4 w-4 text-blue-300" />}
          value={to}
          onChange={onToChange}
          disabled={disabled}
        />
      </div>

      {/* Footer row: script hint + auto-speak toggle */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          {getLang(from).english} → {getLang(to).english}
        </p>

        <button
          type="button"
          onClick={onToggleAutoSpeak}
          aria-pressed={autoSpeak}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
            autoSpeak
              ? "border-blue-400/40 bg-blue-500/10 text-blue-300"
              : "border-white/10 bg-white/5 text-zinc-500"
          }`}
        >
          {autoSpeak ? (
            <Volume2 className="h-3 w-3" />
          ) : (
            <VolumeX className="h-3 w-3" />
          )}
          Auto-speak {autoSpeak ? "on" : "off"}
        </button>
      </div>
    </section>
  );
}
