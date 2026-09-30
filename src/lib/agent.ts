/**
 * Bhasha AI agent — translation brain.
 *
 * Shared by the API route (server) and the browser (request shape + offline
 * fail-safe). The agent's only job: take a spoken sentence in one Indic
 * language and return it in another, in native script.
 */

import { getLang, LANGUAGES, type LangCode } from "./languages";
import { lookupPhrase } from "./phrasebook";
import { romanize } from "./translit";

/* ------------------------------------------------------------------ */
/* Contracts                                                           */
/* ------------------------------------------------------------------ */

export type TranslateRequest = {
  /** What the user said (or typed), in `from`'s script */
  text: string;
  from: LangCode;
  /** Target language — the agent must answer in this language's script */
  to: LangCode;
};

export type TranslationEngine = "gemini" | "mymemory" | "offline";

/** Normalized model/offline answer before we decorate it for the UI. */
export type TranslationDraft = {
  translation: string;
  detectedSourceLanguage?: string;
  note?: string;
};

export type TranslateResponse =
  | { ok: true; engine: TranslationEngine; data: TranslationDraft }
  | { ok: false; error: string };

/** One finished translation, ready to render in the summary card. */
export type TranslationResult = {
  id: string;
  /** Original voice input, exactly as transcribed */
  original: string;
  /** Romanization of the original (helps when the source script is foreign) */
  originalTransliteration: string;
  /** Translation in the target language's native script */
  translated: string;
  /** Romanization of the translation */
  transliteration: string;
  from: LangCode;
  to: LangCode;
  engine: TranslationEngine;
  /** What the model guessed the source language to be */
  detectedSourceLanguage?: string;
  /** Set when we could not fully translate (offline, no phrasebook hit) */
  note?: string;
  createdAt: number;
};

/* ------------------------------------------------------------------ */
/* Prompt                                                             */
/* ------------------------------------------------------------------ */

const LANGUAGE_LIST = LANGUAGES.map(
  (l) => `${l.english} (${l.code}) — script: ${l.scriptName}`,
).join("\n");

/**
 * Canonical system prompt — the API route builds a dynamic version of this
 * per-request (with source/target languages injected). This export is kept
 * for documentation, offline mode, and any future client-side references.
 */
export const AGENT_SYSTEM_PROMPT = `You are Bhasha AI, an expert Indic translation agent. Do NOT do word-by-word translation. Preserve exact context, local idioms, and human intent.

Known languages:
${LANGUAGE_LIST}

Rules:
1. Translate the MEANING faithfully, in natural spoken register — not word by word. Keep the sentence short and speakable.
2. The "translated" field MUST be in the target language's native script (Devanagari for Hindi/Marathi, Tamil script for Tamil, Perso-Arabic for Urdu, Latin for English).
3. The "transliteration" field is the Roman-script reading of the translated text.
4. Keep proper nouns, numbers, amounts, and units as digits inside the target script where natural.
5. Never add explanations, roman letters, or quotes inside "translated" for non-Latin target scripts.
6. If the input is already in the target language, return it cleaned up.

Return strictly valid JSON, no markdown, no code fences:
{"original": "…", "translated": "…", "transliteration": "…", "targetLangCode": "…"}`;

/* ------------------------------------------------------------------ */
/* Normalization — never trust the model blindly                        */
/* ------------------------------------------------------------------ */

export function normalizeDraft(
  raw: unknown,
  req: TranslateRequest,
): TranslationDraft {
  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const candidates = [
    obj.translated,
    obj.translation,
    obj.translatedText,
    obj.text,
    obj.output,
  ];

  let translation = "";
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      translation = c.trim();
      break;
    }
  }

  const detected =
    typeof obj.detectedSourceLanguage === "string" &&
    obj.detectedSourceLanguage.trim()
      ? obj.detectedSourceLanguage.trim()
      : undefined;

  const note =
    typeof obj.note === "string" && obj.note.trim()
      ? obj.note.trim()
      : undefined;

  // Hard fail-safe: an empty translation must never reach the UI
  if (!translation) {
    return {
      translation: lookupPhrase(req.text, req.from, req.to) ?? req.text,
      detectedSourceLanguage: detected,
      note: "Model returned no text — showing the offline reading.",
    };
  }

  // Strip stray wrapping quotes the model likes to add.
  translation = translation.replace(/^["'“”]+|["'“”]+$/g, "").trim();

  return { translation, detectedSourceLanguage: detected, note };
}

/* ------------------------------------------------------------------ */
/* Offline fail-safe                                                   */
/* ------------------------------------------------------------------ */

export function offlineTranslate(req: TranslateRequest): TranslationDraft {
  const phrase = lookupPhrase(req.text, req.from, req.to);

  if (phrase) {
    return {
      translation: phrase,
      detectedSourceLanguage: getLang(req.from).english,
      note: "Offline phrasebook match.",
    };
  }

  const from = getLang(req.from);
  const to = getLang(req.to);

  return {
    // Nothing to translate with — echo the source so the card always has
    // content, and label it honestly instead of faking a translation.
    translation: req.text.trim(),
    detectedSourceLanguage: from.english,
    note: `Offline — no ${from.english}→${to.english} match in the phrasebook. Add GEMINI_API_KEY for live translation.`,
  };
}

/* ------------------------------------------------------------------ */
/* Result assembly                                                     */
/* ------------------------------------------------------------------ */

export function buildResult(
  req: TranslateRequest,
  draft: TranslationDraft,
  engine: TranslationEngine,
): TranslationResult {
  return {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    original: req.text.trim(),
    originalTransliteration: romanize(req.text.trim()),
    translated: draft.translation.trim(),
    transliteration: romanize(draft.translation.trim()),
    from: req.from,
    to: req.to,
    engine,
    detectedSourceLanguage: draft.detectedSourceLanguage,
    note: draft.note,
    createdAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* Client entry point — never throws, always returns a result           */
/* ------------------------------------------------------------------ */

export type AgentRun = {
  result: TranslationResult;
  live: boolean;
};

export async function callAgent(
  req: TranslateRequest,
  signal?: AbortSignal,
): Promise<AgentRun> {
  const clean: TranslateRequest = { ...req, text: req.text.trim() };

  if (!clean.text || clean.from === clean.to) {
    return {
      result: buildResult(clean, { translation: clean.text }, "offline"),
      live: false,
    };
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
      signal,
    });
    const json = (await res.json()) as TranslateResponse;
    if (json.ok) {
      return {
        result: buildResult(clean, json.data, json.engine),
        live: json.engine !== "offline",
      };
    }
    throw new Error(json.error);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return {
      result: buildResult(clean, offlineTranslate(clean), "offline"),
      live: false,
    };
  }
}
