/**
 * POST /api/kisaan — AI Sahayak (Kisaan Farmer Assistant) API route.
 *
 * Accepts the farmer's transcribed question in any Indic language, sends it
 * to Gemini with an agricultural advisor system prompt, and returns a
 * practical solution in the **same local language**.
 */

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getLang, type LangCode } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 45;

/* ------------------------------------------------------------------ */
/* Request / Response contracts                                        */
/* ------------------------------------------------------------------ */

type KisaanRequest = {
  text: string;
  langCode: LangCode;
};

type KisaanSuccessResponse = {
  ok: true;
  solution: string;
  summary: string;
  langCode: string;
};

type KisaanErrorResponse = {
  ok: false;
  error: string;
};

type KisaanResponse = KisaanSuccessResponse | KisaanErrorResponse;

/* ------------------------------------------------------------------ */
/* Gemini system prompt — agricultural advisor persona                  */
/* ------------------------------------------------------------------ */

function buildKisaanSystemPrompt(langName: string, langCode: string): string {
  return `You are "AI Sahayak" (AI सहायक), a trusted and expert Indian agricultural advisor built into the Bhasha AI app.

Your mission is to help real farmers across rural India solve practical, day-to-day farming problems.

RULES:
1. The farmer is speaking to you in ${langName} (${langCode}). You MUST respond in exactly the same language: ${langName}. Do NOT switch to English or any other language.
2. Use simple, clear, everyday language a rural farmer would understand. Avoid jargon unless you immediately explain it.
3. Be practical and actionable — give step-by-step advice the farmer can follow today with locally available resources.
4. Cover the most relevant aspects: cause of the problem, immediate remedy, preventive measures, and when to seek expert help (like a Krishi Vigyan Kendra or local agricultural officer).
5. If the question involves a crop disease or pest, describe symptoms to watch for and suggest organic/low-cost treatments first, then chemical options with proper safety advice.
6. If you are unsure, say so honestly rather than guessing — a wrong farming recommendation can destroy a harvest.
7. Keep your answer concise but thorough — farmers are busy people.
8. Do NOT add English translations, Roman transliteration, or code-switching. Stay purely in ${langName} script.

Return strictly valid JSON, no markdown, no code fences:
{"solution": "Your complete practical advice in ${langName}...", "summary": "A one-line summary of your advice in ${langName}..."}`;
}

/* ------------------------------------------------------------------ */
/* JSON extraction helper                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Gemini call                                                         */
/* ------------------------------------------------------------------ */

type GeminiKisaanResult = {
  solution?: string;
  summary?: string;
};

async function callGeminiKisaan(
  apiKey: string,
  text: string,
  langCode: LangCode,
): Promise<GeminiKisaanResult> {
  const ai = new GoogleGenAI({ apiKey });
  const lang = getLang(langCode);
  const systemPrompt = buildKisaanSystemPrompt(lang.english, lang.code);

  const userPrompt = [
    `Farmer's language: ${lang.english} (${lang.code}) — ${lang.scriptName} script.`,
    `Farmer's question: "${text}"`,
    `Respond with JSON only, entirely in ${lang.english}.`,
  ].join("\n");

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
          temperature: 0.4,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        lastError = "Empty Gemini response";
        continue;
      }

      const jsonText = extractJsonObject(rawText);
      const parsed = JSON.parse(jsonText) as GeminiKisaanResult;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Gemini returned invalid JSON");
      }
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError);
}

/* ------------------------------------------------------------------ */
/* Fallback messages in the user's own language                        */
/* ------------------------------------------------------------------ */

const FALLBACK_MESSAGES: Record<string, { solution: string; summary: string }> =
  {
    hi: {
      solution:
        "क्षमा करें, अभी AI सहायक सेवा उपलब्ध नहीं है। कृपया कुछ समय बाद पुनः प्रयास करें। तत्काल सहायता के लिए अपने नज़दीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें या किसान कॉल सेंटर 1800-180-1551 पर कॉल करें।",
      summary: "सेवा अस्थायी रूप से अनुपलब्ध — KVK या 1800-180-1551 पर संपर्क करें।",
    },
    mr: {
      solution:
        "क्षमस्व, AI सहायक सेवा सध्या उपलब्ध नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा. तात्काळ मदतीसाठी तुमच्या जवळच्या कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा किंवा किसान कॉल सेंटर 1800-180-1551 वर कॉल करा.",
      summary: "सेवा तात्पुरती अनुपलब्ध — KVK किंवा 1800-180-1551 वर संपर्क करा.",
    },
    bn: {
      solution:
        "দুঃখিত, AI সহায়ক পরিষেবা এখন উপলব্ধ নেই। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন। জরুরি সাহায্যের জন্য আপনার নিকটস্থ কৃষি বিজ্ঞান কেন্দ্রে (KVK) যোগাযোগ করুন বা কিষাণ কল সেন্টারে কল করুন 1800-180-1551।",
      summary: "পরিষেবা সাময়িকভাবে অনুপলব্ধ — KVK বা 1800-180-1551-এ যোগাযোগ করুন।",
    },
    ta: {
      solution:
        "மன்னிக்கவும், AI சகாயக் சேவை தற்போது கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும். உடனடி உதவிக்கு உங்கள் அருகிலுள்ள வேளாண் அறிவியல் மையத்தை (KVK) தொடர்பு கொள்ளவும் அல்லது கிசான் கால் சென்டர் 1800-180-1551 ஐ அழைக்கவும்.",
      summary: "சேவை தற்காலிகமாக கிடைக்கவில்லை — KVK அல்லது 1800-180-1551 ஐ தொடர்பு கொள்ளவும்.",
    },
    te: {
      solution:
        "క్షమించండి, AI సహాయక్ సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కొంత సమయం తర్వాత మళ్ళీ ప్రయత్నించండి. తక్షణ సహాయం కోసం మీ సమీపంలోని కృషి విజ్ఞాన కేంద్రాన్ని (KVK) సంప్రదించండి లేదా కిసాన్ కాల్ సెంటర్ 1800-180-1551 కు కాల్ చేయండి.",
      summary: "సేవ తాత్కాలికంగా అందుబాటులో లేదు — KVK లేదా 1800-180-1551 కు కాల్ చేయండి.",
    },
  };

function getFallback(langCode: string) {
  return (
    FALLBACK_MESSAGES[langCode] ?? {
      solution:
        "Sorry, the AI Sahayak service is temporarily unavailable. Please try again shortly. For immediate help, contact your nearest Krishi Vigyan Kendra (KVK) or call the Kisan Call Centre at 1800-180-1551.",
      summary:
        "Service temporarily unavailable — contact KVK or call 1800-180-1551.",
    }
  );
}

/* ------------------------------------------------------------------ */
/* POST handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(
  req: Request,
): Promise<NextResponse<KisaanResponse>> {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }

  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ ok: false, error: "Invalid request body" });
  }

  const obj = raw as Record<string, unknown>;
  const text = (typeof obj.text === "string" ? obj.text : "").trim().slice(0, 2000);
  const langCode = getLang(
    typeof obj.langCode === "string" ? obj.langCode : undefined,
  ).code;

  if (!text) {
    return NextResponse.json({
      ok: false,
      error: "No question text provided",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = getFallback(langCode);
    return NextResponse.json({
      ok: true,
      solution: fallback.solution,
      summary: fallback.summary,
      langCode,
    });
  }

  try {
    const result = await callGeminiKisaan(apiKey, text, langCode);

    const solution =
      typeof result.solution === "string" && result.solution.trim()
        ? result.solution.trim()
        : null;
    const summary =
      typeof result.summary === "string" && result.summary.trim()
        ? result.summary.trim()
        : "";

    if (!solution) {
      throw new Error("Gemini returned no solution text");
    }

    return NextResponse.json({
      ok: true,
      solution,
      summary,
      langCode,
    });
  } catch (error) {
    console.warn(
      "Kisaan Gemini call failed — returning fallback:",
      error instanceof Error ? error.message : error,
    );
    const fallback = getFallback(langCode);
    return NextResponse.json({
      ok: true,
      solution: fallback.solution,
      summary: fallback.summary,
      langCode,
    });
  }
}
