/**
 * Language registry for Bhasha AI — the Universal Indic Voice Translator.
 *
 * Every entry knows three things the app needs:
 *  1. how to label itself to the user (english + native name)
 *  2. which BCP-47 locale the Web Speech API should use (`speech`)
 *  3. which writing system it uses, so the transliterator can romanize it
 */

export type LangCode =
  | "hi"
  | "mr"
  | "bn"
  | "ta"
  | "te"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur"
  | "en";

export type ScriptKey =
  | "devanagari"
  | "bengali"
  | "gurmukhi"
  | "gujarati"
  | "oriya"
  | "tamil"
  | "telugu"
  | "kannada"
  | "malayalam"
  | "arabic"
  | "latin";

export type LanguageDef = {
  code: LangCode;
  /** English label, e.g. "Marathi" */
  english: string;
  /** Endonym in its own script, e.g. "मराठी" */
  native: string;
  /** BCP-47 tag handed to SpeechRecognition / SpeechSynthesis */
  speech: string;
  script: ScriptKey;
  /** Human name of the writing system, shown in the UI */
  scriptName: string;
  /** Region hint shown under the dropdown */
  region: string;
};

/** The 12 Indic languages + English, ordered for the dropdowns. */
export const LANGUAGES: LanguageDef[] = [
  {
    code: "hi",
    english: "Hindi",
    native: "हिन्दी",
    speech: "hi-IN",
    script: "devanagari",
    scriptName: "Devanagari",
    region: "North India",
  },
  {
    code: "mr",
    english: "Marathi",
    native: "मराठी",
    speech: "mr-IN",
    script: "devanagari",
    scriptName: "Devanagari",
    region: "Maharashtra",
  },
  {
    code: "bn",
    english: "Bengali",
    native: "বাংলা",
    speech: "bn-IN",
    script: "bengali",
    scriptName: "Bengali",
    region: "West Bengal",
  },
  {
    code: "ta",
    english: "Tamil",
    native: "தமிழ்",
    speech: "ta-IN",
    script: "tamil",
    scriptName: "Tamil",
    region: "Tamil Nadu",
  },
  {
    code: "te",
    english: "Telugu",
    native: "తెలుగు",
    speech: "te-IN",
    script: "telugu",
    scriptName: "Telugu",
    region: "Andhra · Telangana",
  },
  {
    code: "gu",
    english: "Gujarati",
    native: "ગુજરાતી",
    speech: "gu-IN",
    script: "gujarati",
    scriptName: "Gujarati",
    region: "Gujarat",
  },
  {
    code: "kn",
    english: "Kannada",
    native: "ಕನ್ನಡ",
    speech: "kn-IN",
    script: "kannada",
    scriptName: "Kannada",
    region: "Karnataka",
  },
  {
    code: "ml",
    english: "Malayalam",
    native: "മലയാളം",
    speech: "ml-IN",
    script: "malayalam",
    scriptName: "Malayalam",
    region: "Kerala",
  },
  {
    code: "pa",
    english: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    speech: "pa-Guru-IN",
    script: "gurmukhi",
    scriptName: "Gurmukhi",
    region: "Punjab",
  },
  {
    code: "or",
    english: "Odia",
    native: "ଓଡ଼ିଆ",
    speech: "or-IN",
    script: "oriya",
    scriptName: "Odia",
    region: "Odisha",
  },
  {
    code: "as",
    english: "Assamese",
    native: "অসমীয়া",
    speech: "as-IN",
    script: "bengali",
    scriptName: "Bengali-Assamese",
    region: "Assam",
  },
  {
    code: "ur",
    english: "Urdu",
    native: "اردو",
    speech: "ur-IN",
    script: "arabic",
    scriptName: "Perso-Arabic",
    region: "Pan-India",
  },
  {
    code: "en",
    english: "English",
    native: "English",
    speech: "en-IN",
    script: "latin",
    scriptName: "Latin",
    region: "Global",
  },
];

export const DEFAULT_FROM: LangCode = "hi";
export const DEFAULT_TO: LangCode = "en";

const BY_CODE: Record<string, LanguageDef> = LANGUAGES.reduce(
  (acc, l) => {
    acc[l.code] = l;
    return acc;
  },
  {} as Record<string, LanguageDef>,
);

/** Look up a language, defaulting to English for unknown codes. */
export function getLang(code: string | null | undefined): LanguageDef {
  if (!code) return BY_CODE.en!;
  return BY_CODE[code] ?? BY_CODE.en!;
}

/** "Marathi · मराठी" — used inside <option> text. */
export function langOptionLabel(code: LangCode): string {
  const l = getLang(code);
  return l.code === "en" ? l.english : `${l.english} · ${l.native}`;
}

/** Detect a language code from a raw Web Speech locale, e.g. "ta-IN" → "ta". */
export function codeFromSpeechLocale(locale: string): LangCode | null {
  const base = locale.split("-")[0]?.toLowerCase();
  if (!base) return null;
  return BY_CODE[base] ? (base as LangCode) : null;
}
