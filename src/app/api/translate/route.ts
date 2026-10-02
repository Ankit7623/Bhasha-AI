/**
 * POST /api/translate — Bhasha AI translation API route.
 *
 * Uses Gemini when configured, then MyMemory, then the built-in phrasebook.
 * Accepts { inputText, sourceLang, targetLang } OR legacy { text, from, to }.
 *
 */

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  normalizeDraft,
  offlineTranslate,
  type TranslateRequest,
  type TranslateResponse,
} from "@/lib/agent";
import { getLang } from "@/lib/languages";
import { saveTranslation } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/* Input parsing — supports both new & legacy field names              */
/* ------------------------------------------------------------------ */

function parseBody(raw: unknown): TranslateRequest {
  if (typeof raw !== "object" || raw === null) {
    return { text: "", from: "hi", to: "en" };
  }
  const obj = raw as Record<string, unknown>;

  // New fields: inputText / sourceLang / targetLang
  // Legacy fields: text / from / to
  const text = (
    typeof obj.inputText === "string"
      ? obj.inputText
      : typeof obj.text === "string"
        ? obj.text
        : ""
  ).slice(0, 1200);

  const from = getLang(
    typeof obj.sourceLang === "string"
      ? obj.sourceLang
      : typeof obj.from === "string"
        ? obj.from
        : undefined,
  ).code;

  const to = getLang(
    typeof obj.targetLang === "string"
      ? obj.targetLang
      : typeof obj.to === "string"
        ? obj.to
        : undefined,
  ).code;

  return { text, from, to };
}

/* ------------------------------------------------------------------ */
/* Gemini SDK call                                                     */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(sourceLang: string, targetLang: string): string {
  return [
    "You are Bhasha AI, an expert Indic translation agent.",
    `Translate the input text from ${sourceLang} to ${targetLang}.`,
    "Do NOT do word-by-word translation.",
    "Preserve exact context, local idioms, and human intent.",
    'Return strictly valid JSON: { "original": "...", "translated": "...", "transliteration": "...", "targetLangCode": "..." }',
  ].join(" ");
}

type GeminiTranslation = {
  original?: string;
  translated?: string;
  transliteration?: string;
  targetLangCode?: string;
  // Legacy keys from older prompt formats — accepted during normalization
  translation?: string;
  detectedSourceLanguage?: string;
  note?: string;
};

function extractJsonObject(text: string): string {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

async function callGemini(
  apiKey: string,
  input: TranslateRequest,
): Promise<GeminiTranslation> {
  const ai = new GoogleGenAI({ apiKey });

  const from = getLang(input.from);
  const to = getLang(input.to);

  const systemPrompt = buildSystemPrompt(from.english, to.english);

  const userPrompt = [
    `Source language: ${from.english} (${from.code}) — ${from.scriptName} script.`,
    `Target language: ${to.english} (${to.code}) — ${to.scriptName} script.`,
    `Input text: "${input.text}"`,
    `Respond with JSON only.`,
  ].join("\n");

  // Google rotates model IDs frequently. Prefer the current stable model and
  // fall back to the well-supported lite variant instead of relying on retired
  // pinned names.
  const MODELS = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];
  let lastError = "Gemini request failed";

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        lastError = "Empty Gemini response";
        continue;
      }

      const jsonText = extractJsonObject(rawText);
      const parsed = JSON.parse(jsonText) as GeminiTranslation;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Gemini returned an invalid JSON object");
      }

      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(lastError);
}

type MyMemoryResponse = {
  responseStatus?: number;
  responseData?: { translatedText?: string; match?: number };
};

// Try MyMemory without API key (free service)
async function tryMyMemoryFallback(
  input: TranslateRequest,
): Promise<{ translation: string } | null> {
  try {
    if (input.text.length > 500) return null;

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", input.text);
    url.searchParams.set("langpair", `${input.from}|${input.to}`);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as MyMemoryResponse;
    const translation = payload.responseData?.translatedText?.trim();
    if (
      payload.responseStatus !== 200 ||
      !translation ||
      (payload.responseData?.match ?? 0) < 0.5 ||
      /^query length limit\b/i.test(translation) ||
      translation.toLocaleLowerCase() === input.text.trim().toLocaleLowerCase()
    ) {
      return null;
    }

    return { translation };
  } catch {
    return null;
  }
}

async function fallbackTranslation(input: TranslateRequest) {
  try {
    if (input.text.length > 500) throw new Error("Text exceeds service limit");

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", input.text);
    url.searchParams.set("langpair", `${input.from}|${input.to}`);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Translation provider unavailable");

    const payload = (await response.json()) as MyMemoryResponse;
    const translation = payload.responseData?.translatedText?.trim();
    if (
      payload.responseStatus !== 200 ||
      !translation ||
      (payload.responseData?.match ?? 0) < 0.5 ||
      /^query length limit\b/i.test(translation) ||
      translation.toLocaleLowerCase() === input.text.trim().toLocaleLowerCase()
    ) {
      throw new Error("No usable translation returned");
    }

    return {
      engine: "mymemory" as const,
      data: {
        translation,
        detectedSourceLanguage: getLang(input.from).english,
        note: "Translated by MyMemory. Avoid entering sensitive text.",
      },
    };
  } catch {
    return { engine: "offline" as const, data: offlineTranslate(input) };
  }
}

/* ------------------------------------------------------------------ */
/* Normalize SDK response → internal draft shape                       */
/* ------------------------------------------------------------------ */

function normalizeGeminiResponse(
  raw: GeminiTranslation,
  input: TranslateRequest,
) {
  // The new prompt returns { translated, transliteration, ... }
  // Map to the internal draft shape that normalizeDraft expects
  const adapted: Record<string, unknown> = {
    // "translation" is the key normalizeDraft looks for
    translation: raw.translated ?? raw.translation ?? "",
    detectedSourceLanguage:
      raw.detectedSourceLanguage ?? getLang(input.from).english,
    note: raw.note,
  };
  return normalizeDraft(adapted, input);
}

/* ------------------------------------------------------------------ */
/* POST handler — never 500s; always returns usable JSON               */
/* ------------------------------------------------------------------ */

export async function POST(
  req: Request,
): Promise<NextResponse<TranslateResponse>> {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }

  const input = parseBody(raw);
  const apiKey = process.env.GEMINI_API_KEY;

  // Trivial case: no text, or same-language pair
  if (!input.text.trim() || input.from === input.to) {
    return NextResponse.json({
      ok: true,
      engine: "offline",
      data: { translation: input.text.trim() },
    });
  }

  // ── Fail-safe #1: No API key → try MyMemory, then phrasebook ──
  if (!apiKey) {
    // Try MyMemory first (free, no key needed)
    const mymemoryResult = await tryMyMemoryFallback(input);
    if (mymemoryResult) {
      void saveTranslation({
        source_lang: input.from,
        target_lang: input.to,
        original_text: input.text.trim(),
        translated_text: mymemoryResult.translation,
      });
      return NextResponse.json({
        ok: true,
        engine: "mymemory",
        data: {
          translation: mymemoryResult.translation,
          detectedSourceLanguage: getLang(input.from).english,
          note: "Translated by MyMemory (free service).",
        },
      });
    }
    // Fall back to offline phrasebook
    const fallback = await fallbackTranslation(input);
    void saveTranslation({
      source_lang: input.from,
      target_lang: input.to,
      original_text: input.text.trim(),
      translated_text: fallback.data.translation,
    });
    return NextResponse.json({ ok: true, ...fallback });
  }

  // ── Live Gemini translation via @google/genai SDK ──
  try {
    const geminiResult = await callGemini(apiKey, input);
    const normalized = normalizeGeminiResponse(geminiResult, input);
    // Fire-and-forget: persist to Supabase
    void saveTranslation({
      source_lang: input.from,
      target_lang: input.to,
      original_text: input.text.trim(),
      translated_text: normalized.translation,
      transliteration: geminiResult.transliteration || null,
    });
    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: normalized,
    });
  } catch (error) {
    // ── Fail-safe #2: Gemini failure → public translation, then phrasebook ──
    // Log the reason: a silent fallback hides things like retired model IDs.
    console.warn(
      "Gemini translation failed — falling back to MyMemory/phrasebook:",
      error instanceof Error ? error.message : error,
    );
    const fallback = await fallbackTranslation(input);
    void saveTranslation({
      source_lang: input.from,
      target_lang: input.to,
      original_text: input.text.trim(),
      translated_text: fallback.data.translation,
    });
    return NextResponse.json({ ok: true, ...fallback });
  }
}
