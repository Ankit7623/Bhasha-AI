"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";
import { AudioLines, Fingerprint, Gauge, Languages, Sprout } from "lucide-react";

import { Header } from "@/components/Header";
import { MicButton, type MicState } from "@/components/MicButton";
import { StatusText, type Mode } from "@/components/StatusText";
import { LiveTranscript } from "@/components/LiveTranscript";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslationCard } from "@/components/TranslationCard";
import { ActionBar } from "@/components/ActionBar";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { KisaanToggle } from "@/components/KisaanToggle";
import { SolutionCard, type KisaanResult } from "@/components/SolutionCard";

import {
  getLang,
  DEFAULT_FROM,
  DEFAULT_TO,
  type LangCode,
} from "@/lib/languages";
import { callAgent, type TranslationResult } from "@/lib/agent";
import {
  hasVoiceFor,
  isRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  startSpeechRecognition,
  stopSpeaking,
  stopSpeechRecognition,
  type SRInstance,
} from "@/lib/speech";
import { fetchRecentTranslations } from "@/lib/supabase";

const MAX_HISTORY = 20;

type TranslatorAppProps = {
  /** Resolved on the server — the key itself never reaches the browser. */
  hasGeminiKey: boolean;
};

export function TranslatorApp({ hasGeminiKey }: TranslatorAppProps) {
  /* ---------------- language pair ---------------- */
  const [from, setFrom] = useState<LangCode>(DEFAULT_FROM);
  const [to, setTo] = useState<LangCode>(DEFAULT_TO);

  /* ---------------- voice + translation state ---------------- */
  const [mode, setMode] = useState<Mode>("idle");
  const [micState, setMicState] = useState<MicState>("idle");
  const [finalText, setFinalText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<TranslationResult[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  /* ---------------- kisaan (farmer) mode state ---------------- */
  const [kisaanMode, setKisaanMode] = useState(false);
  const [kisaanResult, setKisaanResult] = useState<KisaanResult | null>(null);
  const [kisaanLoading, setKisaanLoading] = useState(false);
  const [kisaanSpeaking, setKisaanSpeaking] = useState(false);

  /* ---------------- refs the Web Speech callbacks need ---------------- */
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SRInstance | null>(null);
  const recognitionFallbackTimerRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;
  const pairRef = useRef({ from, to });
  pairRef.current = { from, to };
  const autoSpeakRef = useRef(autoSpeak);
  autoSpeakRef.current = autoSpeak;
  const kisaanModeRef = useRef(kisaanMode);
  kisaanModeRef.current = kisaanMode;

  const copyTimer = useRef<number | null>(null);
  const ttsOk = useRef(true);

  /* ---------------- mount: capability probes + load Supabase history ---------------- */
  useEffect(() => {
    ttsOk.current = isSpeechSynthesisSupported();
    if (
      typeof window !== "undefined" &&
      (!navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined")
    ) {
      setMicState("unsupported");
      setMode("unsupported");
    }
    if (!ttsOk.current) {
      setNotice(
        "Voice playback isn't available in this browser — text still works.",
      );
    }

    // Fetch last 10 entries from Supabase on load
    void fetchRecentTranslations(10).then((recent) => {
      if (recent.length > 0) {
        setHistory(recent);
      }
    });

    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      try {
        if (recorderRef.current?.state === "recording")
          recorderRef.current.stop();
      } catch {
        /* noop */
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      stopSpeaking();
    };
  }, []);

  /* ---------------- speech output ---------------- */
  const speak = useCallback(
    (text: string, langCode: LangCode, romanizedText = "") => {
      if (!ttsOk.current || !text.trim()) return;
      const locale = getLang(langCode).speech;
      const hasTargetVoice = hasVoiceFor(locale);
      const playbackText = hasTargetVoice ? text : romanizedText.trim();
      const playbackLocale = hasTargetVoice ? locale : getLang("en").speech;

      if (!playbackText || (!hasTargetVoice && !hasVoiceFor(playbackLocale))) {
        setNotice(
          `No speech voice is installed for ${getLang(langCode).english}.`,
        );
        return;
      }

      if (!hasTargetVoice) {
        setNotice(
          `No ${getLang(langCode).english} voice is installed; reading the Roman pronunciation with an English voice.`,
        );
      }
      setSpeaking(true);
      speakText(playbackText, playbackLocale, () => setSpeaking(false));
    },
    [],
  );

  const handlePlay = useCallback(() => {
    if (!result) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    speak(result.translated, result.to, result.transliteration);
  }, [result, speaking, speak]);

  /* ---------------- kisaan (farmer) assistant call ---------------- */
  const callKisaanApi = useCallback(
    async (text: string, langCode: LangCode) => {
      setKisaanLoading(true);
      setKisaanResult(null);
      setNotice(null);
      try {
        const res = await fetch("/api/sahayak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, langCode }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          solution?: string;
          summary?: string;
          langCode?: string;
          error?: string;
        };
        if (!json.ok || !json.solution) {
          throw new Error(json.error || "AI Sahayak could not generate advice.");
        }
        const result: KisaanResult = {
          question: text,
          solution: json.solution,
          summary: json.summary || "",
          langCode,
        };
        setKisaanResult(result);
        // Auto-speak the solution
        if (autoSpeakRef.current) {
          const locale = getLang(langCode).speech;
          setKisaanSpeaking(true);
          speakText(result.solution, locale, () => setKisaanSpeaking(false));
        }
      } catch (err) {
        setNotice(
          err instanceof Error
            ? err.message
            : "AI Sahayak failed — try again.",
        );
      } finally {
        setKisaanLoading(false);
        setMode("ready");
        setMicState("idle");
      }
    },
    [],
  );

  const handleKisaanSpeak = useCallback(() => {
    if (!kisaanResult) return;
    if (kisaanSpeaking) {
      stopSpeaking();
      setKisaanSpeaking(false);
      return;
    }
    const locale = getLang(kisaanResult.langCode).speech;
    setKisaanSpeaking(true);
    speakText(kisaanResult.solution, locale, () => setKisaanSpeaking(false));
  }, [kisaanResult, kisaanSpeaking]);

  /* ---------------- run one translation ---------------- */
  const commit = useCallback(
    (translation: TranslationResult) => {
      setResult(translation);
      setHistory((previous) =>
        [
          translation,
          ...previous.filter((item) => item.id !== translation.id),
        ].slice(0, MAX_HISTORY),
      );
      // Persistence belongs to /api/translate, which stores the model's own
      // transliteration. Writing again here created a second copy of every
      // translation in translation_history.
      if (autoSpeakRef.current) {
        speak(
          translation.translated,
          translation.to,
          translation.transliteration,
        );
      }
    },
    [speak],
  );

  const translateFinal = useCallback(
    async (text: string, fromCode: LangCode, toCode: LangCode) => {
      setMode("thinking");
      setMicState("thinking");

      // Route to Kisaan API when farmer mode is active
      if (kisaanModeRef.current) {
        await callKisaanApi(text, fromCode);
        return;
      }

      try {
        const { result: translated } = await callAgent({
          text,
          from: fromCode,
          to: toCode,
        });
        commit(translated);
        setMode("ready");
        setMicState("idle");
      } catch {
        setMode("idle");
        setMicState("idle");
        setNotice("Translation failed — check your connection and try again.");
      }
    },
    [commit, callKisaanApi],
  );

  const handleTranslateTyped = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = typedText.trim();
      if (!text || mode === "thinking") return;
      setFinalText(text);
      setNotice(null);
      await translateFinal(text, from, to);
    },
    [from, mode, to, translateFinal, typedText],
  );

  /* ---------------- recorded audio transcription ---------------- */
  const transcribeRecording = useCallback(async () => {
    const chunks = recordedChunksRef.current;
    const mimeType =
      chunks[0]?.type || recorderRef.current?.mimeType || "audio/webm";
    const audio = new Blob(chunks, { type: mimeType });
    recordedChunksRef.current = [];
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    recorderRef.current = null;

    if (!audio.size) {
      setMode("idle");
      setMicState("idle");
      setNotice("No audio was captured. Check your microphone and try again.");
      return;
    }

    setMode("thinking");
    setMicState("thinking");
    setNotice(null);
    const form = new FormData();
    form.append("audio", audio, "voice.webm");
    form.append("from", pairRef.current.from);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        transcript?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "Voice transcription failed.");

      const transcript = payload.transcript?.trim();
      if (!transcript) throw new Error("No speech was recognized. Try again.");
      setFinalText(transcript);
      await translateFinal(
        transcript,
        pairRef.current.from,
        pairRef.current.to,
      );
    } catch (error) {
      setMode("idle");
      setMicState("idle");
      setNotice(
        error instanceof Error
          ? error.message
          : "Voice transcription failed. Try again.",
      );
    }
  }, [translateFinal]);

  /* ---------------- microphone recording lifecycle ---------------- */
  const stopListening = useCallback(() => {
    if (recognitionFallbackTimerRef.current) {
      window.clearTimeout(recognitionFallbackTimerRef.current);
      recognitionFallbackTimerRef.current = null;
    }
    stopSpeechRecognition(recognitionRef.current);
    recognitionRef.current = null;
    try {
      if (recorderRef.current?.state === "recording")
        recorderRef.current.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const startListening = useCallback(async () => {
    const startFallbackRecorder = async () => {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        setMicState("unsupported");
        setMode("unsupported");
        setNotice(
          "Audio recording isn't supported in this browser — try Chrome, Edge or Safari.",
        );
        return;
      }

      setFinalText("");
      setNotice(null);
      stopSpeaking();
      setSpeaking(false);
      setMicState("thinking");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = stream;
        recordedChunksRef.current = [];
        const mimeType = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
        ].find((type) => MediaRecorder.isTypeSupported(type));
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };
        recorder.onstop = () => void transcribeRecording();
        recorder.onerror = () => {
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          recorderRef.current = null;
          setMode("idle");
          setMicState("idle");
          setNotice(
            "Microphone recording failed. Check the device and try again.",
          );
        };
        recorder.start(250);
        setMode("listening");
        setMicState("listening");
      } catch (error) {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        recorderRef.current = null;
        setMode("idle");
        const denied =
          error instanceof DOMException && error.name === "NotAllowedError";
        setMicState(denied ? "denied" : "idle");
        setNotice(
          denied
            ? "Microphone blocked — allow mic access in your browser settings."
            : "Could not start microphone recording. Check the device and try again.",
        );
      }
    };

    if (isRecognitionSupported()) {
      setFinalText("");
      setNotice(null);
      stopSpeaking();
      setSpeaking(false);
      setMode("listening");
      setMicState("listening");

      let hasCapturedText = false;
      const recognition = startSpeechRecognition({
        lang: getLang(pairRef.current.from).speech,
        onResult: async (transcript, isFinal) => {
          if (recognitionFallbackTimerRef.current) {
            window.clearTimeout(recognitionFallbackTimerRef.current);
            recognitionFallbackTimerRef.current = null;
          }
          setFinalText(transcript);
          if (isFinal || transcript.trim().length > 3) {
            hasCapturedText = true;
            setMode("thinking");
            setMicState("thinking");
            setNotice(null);
            await translateFinal(
              transcript,
              pairRef.current.from,
              pairRef.current.to,
            );
          }
        },
        onError: () => {
          if (recognitionFallbackTimerRef.current) {
            window.clearTimeout(recognitionFallbackTimerRef.current);
            recognitionFallbackTimerRef.current = null;
          }
          recognitionRef.current = null;
          void startFallbackRecorder();
        },
        onEnd: () => {
          if (recognitionFallbackTimerRef.current) {
            window.clearTimeout(recognitionFallbackTimerRef.current);
            recognitionFallbackTimerRef.current = null;
          }
          if (modeRef.current === "listening" && !hasCapturedText) {
            void startFallbackRecorder();
          } else if (modeRef.current === "listening") {
            setMode("idle");
            setMicState("idle");
          }
          recognitionRef.current = null;
        },
      });

      if (recognition) {
        recognitionRef.current = recognition;
        recognitionFallbackTimerRef.current = window.setTimeout(() => {
          if (modeRef.current === "listening") {
            stopSpeechRecognition(recognitionRef.current);
            recognitionRef.current = null;
            void startFallbackRecorder();
          }
        }, 12000);
        return;
      }
    }

    await startFallbackRecorder();
  }, [transcribeRecording, translateFinal]);

  const handleToggleMic = useCallback(() => {
    const m = modeRef.current;
    if (m === "listening") stopListening();
    else if (m === "thinking") return;
    else void startListening();
  }, [startListening, stopListening]);

  /* Stop listening when the tab is hidden (mobile browsers kill the mic) */
  useEffect(() => {
    if (mode !== "listening") return;
    const onVisibility = () => {
      if (document.hidden) stopListening();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [mode, stopListening]);

  /* ---------------- swapping + language changes ---------------- */
  const swapLanguages = useCallback(() => {
    setFrom(to);
    setTo(from);
    // The previous result flips with the pair, so the card stays truthful.
    setResult((prev) =>
      prev
        ? {
            ...prev,
            from: prev.to,
            to: prev.from,
            original: prev.translated,
            originalTransliteration: prev.transliteration,
            translated: prev.original,
            transliteration: prev.originalTransliteration,
          }
        : prev,
    );
    setNotice(null);
  }, [from, to]);

  /* Changing the pair clears the card, so the "ready" state must clear with
     it — otherwise the status line keeps promising a translation that is no
     longer on screen. */
  const resetResult = useCallback(() => {
    setResult(null);
    // Only clear the states that claim a translation is on screen; mic
    // permission/unsupported guidance must survive a language change.
    setMode((current) =>
      current === "ready" || current === "thinking" ? "idle" : current,
    );
    setMicState((current) => (current === "thinking" ? "idle" : current));
    setNotice(null);
  }, []);

  const changeFrom = useCallback(
    (code: LangCode) => {
      if (code === to) setTo(from);
      setFrom(code);
      resetResult();
    },
    [from, to, resetResult],
  );

  const changeTo = useCallback(
    (code: LangCode) => {
      if (code === from) setFrom(to);
      setTo(code);
      resetResult();
    },
    [from, to, resetResult],
  );

  /* ---------------- share + copy ---------------- */
  const composedMessage = useCallback((r: TranslationResult) => {
    const mainText = r.translated;
    const extra =
      r.transliteration && r.transliteration !== r.translated
        ? ` (${r.transliteration})`
        : "";
    return `${mainText}${extra}`;
  }, []);

  const handleShare = useCallback(() => {
    if (!result) return;
    const url = `https://wa.me/?text=${encodeURIComponent(composedMessage(result))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setNotice("Opening WhatsApp…");
  }, [result, composedMessage]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = composedMessage(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setNotice("Translation copied to clipboard.");
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setNotice("Copy failed — your browser blocked clipboard access.");
    }
  }, [result, composedMessage]);

  /* ---------------- history ---------------- */
  const selectHistoryItem = useCallback((item: TranslationResult) => {
    setResult(item);
    setFrom(item.from);
    setTo(item.to);
    setHistoryOpen(false);
    setNotice(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryOpen(false);
  }, []);

  const fromLang = getLang(from);
  const toLang = getLang(to);
  const micBlocked = micState === "denied" || micState === "unsupported";

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#050814] text-slate-100">
      {/* Ambient aurora background mesh */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-36 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px] animate-aurora" />
        <div className="absolute right-[-100px] top-1/3 h-[380px] w-[380px] rounded-full bg-sky-500/12 blur-[130px] animate-aurora [animation-delay:-5s]" />
        <div className="absolute bottom-[-140px] left-[-100px] h-[400px] w-[400px] rounded-full bg-amber-500/8 blur-[140px] animate-aurora [animation-delay:-9s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_25%,black,transparent)]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="mx-auto w-full max-w-xl px-5 pb-44 pt-6">
          {/* ---- Hero ---- */}
          <section className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/25 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200 shadow-[0_0_16px_rgba(99,102,241,0.15)]">
                <AudioLines className="h-3 w-3 text-sky-400" />
                हिन्दी · मराठी · தமிழ் · বাংলা · తెలుగు · ਪੰਜਾਬੀ · ગુજરાતી
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Speak your mother tongue.
                <br />
                <span className="bg-gradient-to-r from-sky-300 via-indigo-200 to-amber-200 bg-clip-text text-transparent text-glow-neon">
                  Be understood anywhere.
                </span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-slate-400">
                Bhasha AI captures voice in 12+ Indian languages, delivers real-time AI translation, native script, Roman pronunciation, and natural voice playback.
              </p>
            </div>

            {/* ---- Kisaan Mode toggle ---- */}
            <div className="w-full">
              <KisaanToggle
                enabled={kisaanMode}
                onToggle={() => {
                  setKisaanMode((v) => !v);
                  setKisaanResult(null);
                  setNotice(null);
                }}
                disabled={mode === "listening" || mode === "thinking"}
              />
            </div>

            {/* ---- Language selector bar ---- */}
            <div className="w-full">
              <LanguageSelector
                from={from}
                to={to}
                onFromChange={changeFrom}
                onToChange={changeTo}
                onSwap={swapLanguages}
                autoSpeak={autoSpeak}
                onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
                disabled={mode === "listening" || mode === "thinking"}
              />
            </div>

            {/* ---- Central voice action ---- */}
            <MicButton state={micState} onToggle={handleToggleMic} />

            <StatusText
              mode={mode}
              fromName={fromLang.english}
              toName={toLang.english}
            />

            <LiveTranscript
              open={mode === "listening" || mode === "thinking"}
              finalText={finalText}
              fromName={fromLang.english}
            />

            <form
              onSubmit={handleTranslateTyped}
              className="w-full space-y-2 text-left"
            >
              <label
                htmlFor="typed-translation"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                Or type a phrase
              </label>
              <div className="flex items-stretch gap-2">
                <textarea
                  id="typed-translation"
                  rows={2}
                  value={typedText}
                  onChange={(event) => setTypedText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (typedText.trim() && mode !== "thinking") {
                        const fakeEvent = {
                          preventDefault: () => {},
                        } as FormEvent<HTMLFormElement>;
                        void handleTranslateTyped(fakeEvent);
                      }
                    }
                  }}
                  placeholder="Enter text to translate (Press Enter to translate)..."
                  disabled={mode === "thinking"}
                  className="min-h-14 min-w-0 flex-1 resize-y rounded-2xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none backdrop-blur-md placeholder:text-slate-500 focus:border-indigo-400/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!typedText.trim() || mode === "thinking"}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-stretch rounded-2xl border border-indigo-400/35 bg-gradient-to-b from-indigo-500/20 to-indigo-600/10 px-5 text-sm font-bold text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300 hover:border-indigo-400/60 hover:bg-indigo-500/30 hover:text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Languages className="h-4 w-4 text-amber-400" />
                  Translate
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500">
                {!hasGeminiKey ? (
                  <>
                    Voice transcription needs{" "}
                    <code className="rounded border border-white/[0.08] bg-black/40 px-1 py-0.5 text-[9px] text-amber-300">
                      GEMINI_API_KEY
                    </code>{" "}
                    in{" "}
                    <code className="rounded border border-white/[0.08] bg-black/40 px-1 py-0.5 text-[9px] text-slate-300">
                      .env.local
                    </code>{" "}
                    — typed text works directly.{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 underline hover:text-sky-300"
                    >
                      Get free key
                    </a>
                    .
                  </>
                ) : (
                  <>
                    Voice translates via Gemini 2.5 Flash with Indic phonetics engine.
                  </>
                )}
              </p>
            </form>
          </section>

          {/* ---- Kisaan Solution / Translation Card ---- */}
          {kisaanMode ? (
            <section className="mt-9">
              <div className="mb-3 flex items-center gap-3 px-1">
                <h3 className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                  <Sprout className="h-3 w-3 text-emerald-400" />
                  AI Sahayak
                </h3>
              </div>
              <div className="max-h-[36rem] overflow-y-auto">
                <SolutionCard
                  result={kisaanResult}
                  loading={kisaanLoading}
                  speaking={kisaanSpeaking}
                  onSpeak={handleKisaanSpeak}
                />
              </div>
            </section>
          ) : (
            <section className="mt-9">
              <div className="mb-3 flex items-center gap-3 px-1">
                <h3 className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <Gauge className="h-3 w-3 text-sky-400" />
                  Visual Summary
                </h3>
              </div>

              <div className="h-[32rem] overflow-y-auto">
                <TranslationCard
                  result={result}
                  speaking={speaking}
                  onPlay={handlePlay}
                />
              </div>
            </section>
          )}

          {/* ---- Action bar ---- */}
          <section className="mt-4">
            <ActionBar
              disabled={!result || micBlocked}
              copied={copied}
              onShare={handleShare}
              onCopy={handleCopy}
            />
          </section>

          {/* ---- Inline notice ---- */}
          <div className="mt-4 flex min-h-10 items-start justify-center">
            {notice && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs font-semibold leading-5 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                role="status"
              >
                {notice}
              </motion.p>
            )}
          </div>

          {/* ---- Footer ---- */}
          <footer className="mt-10 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Languages className="h-3 w-3 text-sky-400" />
              Gemini Voice Transcription · 12+ Indian Languages
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/80">
              <Fingerprint className="h-3 w-3 text-amber-400" />
              Built with Pride for Bharat
            </span>
          </footer>
        </main>
      </div>

      {/* ---- History drawer ---- */}
      <HistoryDrawer
        items={history}
        open={historyOpen}
        onToggle={() => setHistoryOpen((v) => !v)}
        onSelect={selectHistoryItem}
        onClear={clearHistory}
      />
    </div>
  );
}
