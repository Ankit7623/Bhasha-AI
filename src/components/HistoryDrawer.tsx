"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, History, Play, Trash2 } from "lucide-react";
import type { TranslationResult } from "@/lib/agent";
import { getLang } from "@/lib/languages";

type HistoryDrawerProps = {
  items: TranslationResult[];
  open: boolean;
  onToggle: () => void;
  onSelect: (item: TranslationResult) => void;
  onClear: () => void;
};

function timeAgo(ts: number): string {
  const secs = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function HistoryDrawer({
  items,
  open,
  onToggle,
  onSelect,
  onClear,
}: HistoryDrawerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-xl px-3 pb-3">
        <div className="glass-elevated overflow-hidden rounded-3xl border-white/10 shadow-[0_-12px_50px_rgba(0,0,0,0.85)]">
          {/* Handle / collapsed header */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls="history-sheet"
            className="relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
          >
            <span className="absolute inset-x-0 top-1.5 mx-auto h-1 w-10 rounded-full bg-white/20" />
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
              <History className="h-4 w-4 text-indigo-300" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-bold tracking-tight text-white">
                Recent Voice Translations
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {items.length === 0
                  ? "Your recent voice translations appear here"
                  : `${items.length} translation${items.length === 1 ? "" : "s"} saved · tap to reload`}
              </span>
            </span>
            {items.length > 0 && (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-bold text-indigo-200">
                {items.length}
              </span>
            )}
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5"
            >
              <ChevronUp className="h-3.5 w-3.5 text-slate-300" />
            </motion.span>
          </button>

          {/* Sheet body */}
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                id="history-sheet"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 28 }}
                className="overflow-hidden border-t border-white/[0.08]"
              >
                <div className="flex items-center justify-between px-4 pt-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Session History
                  </span>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-[46vh] space-y-2 overflow-y-auto p-3">
                  {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-500">
                      No translations yet — tap the mic to speak.
                    </p>
                  ) : (
                    items.map((item) => {
                      const from = getLang(item.from);
                      const to = getLang(item.to);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelect(item)}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/40 p-3 text-left backdrop-blur-sm transition-all duration-300 hover:border-indigo-400/40 hover:bg-indigo-500/[0.08] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {from.english}
                              <span className="text-slate-600">→</span>
                              <span className="font-extrabold text-amber-300">
                                {to.english}
                              </span>
                              <span className="text-slate-600">·</span>
                              {timeAgo(item.createdAt)}
                            </span>
                            <span className="truncate text-[11px] text-slate-400">
                              {item.original}
                            </span>
                            <span className="truncate text-sm font-semibold text-slate-100 group-hover:text-sky-200">
                              {item.translated}
                            </span>
                          </span>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-indigo-400/25 bg-indigo-500/10 text-indigo-300 transition-all duration-300 group-hover:scale-110 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/20 group-hover:text-white">
                            <Play className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
