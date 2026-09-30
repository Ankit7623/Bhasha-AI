/**
 * Web Speech API helpers — 100% native browser, no paid keys.
 * - Recognition: window.SpeechRecognition / webkitSpeechRecognition (Chrome/Edge/Safari)
 * - Synthesis:   window.speechSynthesis via speakText(text, locale)
 * Every helper degrades gracefully instead of throwing.
 */

/* ------------------------------------------------------------------ */
/* Minimal Web Speech recognition typings (webkit-prefixed in Chrome)  */
/* ------------------------------------------------------------------ */

export interface SRAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
export interface SRResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SRAlternative;
}
export interface SRResultList {
  readonly length: number;
  [index: number]: SRResult;
}
export interface SREvent {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
export interface SRErrorEvent {
  readonly error: string;
  readonly message?: string;
}
export interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((e: Event) => void) | null;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SRInstance;

/** Feature-detect the recognition constructor (null when unsupported). */
export function getRecognitionCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const isRecognitionSupported = () => getRecognitionCtor() !== null;

export function startSpeechRecognition(options: {
  lang: string;
  onResult: (text: string) => void;
  onError: (message: string) => void;
  onEnd?: () => void;
}): SRInstance | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  try {
    const recognition = new Ctor();
    recognition.lang = options.lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SREvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0]?.transcript?.trim() ?? "";
        if (chunk) transcript = chunk;
        if (result.isFinal) break;
      }
      if (transcript) options.onResult(transcript);
    };

    recognition.onerror = (event: SRErrorEvent) => {
      options.onError(event.error || "Speech recognition failed.");
    };

    recognition.onend = () => options.onEnd?.();
    recognition.start();
    return recognition;
  } catch {
    options.onError("Speech recognition could not be started.");
    return null;
  }
}

export function stopSpeechRecognition(recognition: SRInstance | null) {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch {
    /* noop */
  }
}

export const isSpeechSynthesisSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

/* ------------------------------------------------------------------ */
/* Text-to-speech                                                      */
/* ------------------------------------------------------------------ */

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  if (cachedVoices.length) return cachedVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return voices;
}

// Voices load asynchronously in most browsers — refresh the cache when ready.
if (isSpeechSynthesisSupported()) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  } catch {
    /* never crash on voice caching */
  }
}

/** Best available voice for a BCP-47 locale, e.g. "ta-IN". */
function pickVoice(locale: string): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  const base = locale.split("-")[0] ?? locale;
  const norm = (s: string) => s.replace("_", "-").toLowerCase();
  return (
    voices.find((v) => norm(v.lang) === norm(locale)) ??
    voices.find((v) => norm(v.lang).startsWith(base)) ??
    voices.find((v) => v.name.toLowerCase().includes(base)) ??
    null
  );
}

/** Is there a real TTS voice installed for this locale? */
export function hasVoiceFor(locale: string): boolean {
  return pickVoice(locale) !== null;
}

/**
 * Speak a line using the browser's speech synthesis.
 * Returns false (silently) when synthesis is unavailable — never throws.
 * `onEnd` fires when playback finishes (or immediately if TTS is blocked).
 */
export function speakText(
  message: string,
  locale = "en-IN",
  onEnd?: () => void,
): boolean {
  if (!isSpeechSynthesisSupported() || !message.trim()) {
    onEnd?.();
    return false;
  }
  try {
    const synth = window.speechSynthesis;
    synth.cancel(); // interrupt anything already speaking
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = locale;
    utterance.rate = 0.98;
    utterance.pitch = 1;
    const voice = pickVoice(locale);
    if (voice) utterance.voice = voice;
    if (onEnd) {
      let done = false;
      const once = () => {
        if (done) return;
        done = true;
        onEnd();
      };
      utterance.onend = once;
      // Safety net: some engines never fire onend after synth.cancel()
      const estimate = Math.min(20000, 1800 + message.length * 90) + 2500;
      window.setTimeout(once, estimate);
    }
    synth.speak(utterance);
    return true;
  } catch {
    onEnd?.();
    return false;
  }
}

export const isSpeaking = () =>
  isSpeechSynthesisSupported() &&
  (window.speechSynthesis.speaking || window.speechSynthesis.pending);

/** Stop any ongoing speech. Safe to call anywhere. */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }
}
