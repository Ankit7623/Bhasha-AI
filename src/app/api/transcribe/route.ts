import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getLang } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/**
 * Provider errors are long JSON blobs, and this string is shown in the UI.
 * Map them to something a traveller can act on; the raw text stays in the log.
 */
function friendlyTranscribeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof (error as { status?: unknown })?.status === "number"
      ? (error as { status: number }).status
      : undefined;
  const text = `${status ?? ""} ${message}`;

  if (status === 429 || /RESOURCE_EXHAUSTED|\bquota\b/i.test(text)) {
    return "Voice transcription is busy right now — try again in a moment.";
  }
  if (/API[_ ]?key|PERMISSION_DENIED|UNAUTHENTICATED|\b(401|403)\b/i.test(text)) {
    return "Voice transcription is misconfigured — check the Gemini API key.";
  }
  if (/no longer available|NOT_FOUND|\b404\b/i.test(text)) {
    return "Voice transcription is temporarily unavailable — please try again later.";
  }
  if (/high demand|overloaded|UNAVAILABLE|\b503\b/i.test(text)) {
    return "Voice transcription is temporarily unavailable — please try again shortly.";
  }
  if (/timeout|timed out|DEADLINE_EXCEEDED/i.test(text)) {
    return "Voice transcription took too long — try a shorter phrase.";
  }
  return "Voice transcription failed. Please try again.";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Voice transcription needs GEMINI_API_KEY. Add it to .env.local and restart the app.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid audio upload." },
      { status: 400 },
    );
  }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { error: "No microphone audio was received." },
      { status: 400 },
    );
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Recording is too large. Record a shorter phrase." },
      { status: 413 },
    );
  }

  const sourceCode = form.get("from");
  const source = getLang(
    typeof sourceCode === "string" ? sourceCode : undefined,
  );
  const mimeType = audio.type || "audio/webm";
  const data = Buffer.from(await audio.arrayBuffer()).toString("base64");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Transcribe the spoken audio to plain text in ${source.english}. Return only the transcript, with no extra commentary.`;
    // `-latest` aliases survive Google's model rotations (pinned 2.5/2.0 flash
    // IDs are retired for existing keys), then a current pinned fallback.
    const models = [
      "gemini-flash-lite-latest",
      "gemini-flash-latest",
      "gemini-3.8-flash",
    ];
    let lastError = "Voice transcription failed.";

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, { inlineData: { mimeType, data } }],
            },
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 300,
          },
        });

        const transcript = response.text?.trim();
        if (transcript) {
          return NextResponse.json({ transcript });
        }

        lastError =
          "No speech was recognized. Try speaking closer to the microphone.";
      } catch (err) {
        // Keep the provider's exact wording in the log, show the user something readable.
        console.warn(
          `Gemini transcription failed (${model}):`,
          err instanceof Error ? err.message : err,
        );
        lastError = friendlyTranscribeError(err);
      }
    }

    return NextResponse.json(
      {
        error: lastError,
      },
      { status: 422 },
    );
  } catch (err) {
    console.warn(
      "Gemini transcription setup failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error:
          "Voice transcription failed. Check the Gemini API key and try again.",
      },
      { status: 502 },
    );
  }
}
