/**
 * Romanization (transliteration) engine for Bhasha AI.
 *
 * Pure TypeScript, zero dependencies, runs on client and server. Indic
 * scripts are structurally similar (consonant + inherent vowel, matras for
 * the other vowels, a virama to kill the inherent vowel), so one generic
 * algorithm drives all of them from a per-script table.
 *
 * Perso-Arabic (Urdu) has no inherent vowel, so it uses its own table with a
 * straight character-by-character mapping.
 *
 * Output is a readable Roman spelling ("vaNakkam" style is avoided — we emit
 * lowercase ASCII, e.g. "vanakkam"), not a scholarly ISO transliteration.
 */

import { getLang, type ScriptKey } from "./languages";

/* ------------------------------------------------------------------ */
/* Script tables                                                       */
/* ------------------------------------------------------------------ */

type BrahmicTable = {
  /** Independent vowel letters → roman */
  vowels: Record<string, string>;
  /** Consonant letters → roman (NO inherent vowel included) */
  consonants: Record<string, string>;
  /** Dependent vowel signs (matras) → roman, replaces the inherent vowel */
  matras: Record<string, string>;
  /** Anusvara / visarga / nukta / chandrabindu etc. → roman */
  signs: Record<string, string>;
  /** Virama / halant / pulli — kills the inherent vowel */
  virama: string;
  /** The vowel appended after a bare consonant */
  inherent: string;
  /** Native digits → ASCII digits */
  digits: Record<string, string>;
};

const DEVANAGARI: BrahmicTable = {
  vowels: {
    अ: "a", आ: "aa", इ: "i", ई: "ee", उ: "u", ऊ: "oo", ऋ: "ri", ॠ: "ri",
    ऌ: "li", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऍ: "e", ऑ: "o", ऎ: "e", ऒ: "o",
  },
  consonants: {
    क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "ng",
    च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "ny",
    ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
    त: "t", थ: "th", द: "d", ध: "dh", न: "n",
    प: "p", फ: "ph", ब: "b", भ: "bh", म: "m",
    य: "y", र: "r", ल: "l", व: "v", ळ: "l",
    श: "sh", ष: "sh", स: "s", ह: "h",
    क़: "q", ख़: "kh", ग़: "gh", ज़: "z", ड़: "r", ढ़: "rh", फ़: "f", य़: "y",
    क्ष: "ksh", ज्ञ: "gy", श्र: "shr", त्र: "tr", द्य: "dy", द्व: "dv",
  },
  matras: {
    "ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri",
    "ॄ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o",
    "ॅ": "e", "ॆ": "e", "ॊ": "o",
  },
  signs: { "ं": "n", "ँ": "n", "ः": "h", "़": "", "ऽ": "", "ॐ": "om" },
  virama: "्",
  inherent: "a",
  digits: { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" },
};

const BENGALI: BrahmicTable = {
  vowels: {
    অ: "a", আ: "aa", ই: "i", ঈ: "ee", উ: "u", ঊ: "oo", ঋ: "ri",
    এ: "e", ঐ: "oi", ও: "o", ঔ: "ou",
  },
  consonants: {
    ক: "k", খ: "kh", গ: "g", ঘ: "gh", ঙ: "ng",
    চ: "ch", ছ: "chh", জ: "j", ঝ: "jh", ঞ: "ny",
    ট: "t", ঠ: "th", ড: "d", ঢ: "dh", ণ: "n",
    ত: "t", থ: "th", দ: "d", ধ: "dh", ন: "n",
    প: "p", ফ: "ph", ব: "b", ভ: "bh", ম: "m",
    য: "j", র: "r", ল: "l", শ: "sh", ষ: "sh", স: "s", হ: "h",
    ড়: "r", ঢ়: "rh", য়: "y", ৎ: "t", ৰ: "r", ৱ: "w", ক্ষ: "kkh",
  },
  matras: {
    "া": "aa", "ি": "i", "ী": "ee", "ু": "u", "ূ": "oo", "ৃ": "ri",
    "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
  },
  signs: { "ং": "ng", "ঃ": "h", "ঁ": "n", "্": "" },
  virama: "্",
  inherent: "a",
  digits: { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" },
};

const GURMUKHI: BrahmicTable = {
  vowels: {
    ਅ: "a", ਆ: "aa", ਇ: "i", ਈ: "ee", ਉ: "u", ਊ: "oo",
    ਏ: "e", ਐ: "ai", ਓ: "o", ਔ: "au",
  },
  consonants: {
    ਕ: "k", ਖ: "kh", ਗ: "g", ਘ: "gh", ਙ: "ng",
    ਚ: "ch", ਛ: "chh", ਜ: "j", ਝ: "jh", ਞ: "ny",
    ਟ: "t", ਠ: "th", ਡ: "d", ਢ: "dh", ਣ: "n",
    ਤ: "t", ਥ: "th", ਦ: "d", ਧ: "dh", ਨ: "n",
    ਪ: "p", ਫ: "ph", ਬ: "b", ਭ: "bh", ਮ: "m",
    ਯ: "y", ਰ: "r", ਲ: "l", ਵ: "v", ਲ਼: "l",
    ਸ਼: "sh", ਸ: "s", ਹ: "h", ਖ਼: "kh", ਗ਼: "gh", ਜ਼: "z", ਫ਼: "f", ੜ: "r",
  },
  matras: {
    "ਾ": "aa", "ਿ": "i", "ੀ": "ee", "ੁ": "u", "ੂ": "oo",
    "ੇ": "e", "ੈ": "ai", "ੋ": "o", "ੌ": "au",
  },
  signs: { "ਂ": "n", "ੰ": "n", "ਁ": "n", "ਃ": "h" },
  virama: "੍",
  inherent: "a",
  digits: { "੦": "0", "੧": "1", "੨": "2", "੩": "3", "੪": "4", "੫": "5", "੬": "6", "੭": "7", "੮": "8", "੯": "9" },
};

const GUJARATI: BrahmicTable = {
  vowels: {
    અ: "a", આ: "aa", ઇ: "i", ઈ: "ee", ઉ: "u", ઊ: "oo", ઋ: "ri",
    એ: "e", ઐ: "ai", ઓ: "o", ઔ: "au",
  },
  consonants: {
    ક: "k", ખ: "kh", ગ: "g", ઘ: "gh", ઙ: "ng",
    ચ: "ch", છ: "chh", જ: "j", ઝ: "jh", ઞ: "ny",
    ટ: "t", ઠ: "th", ડ: "d", ઢ: "dh", ણ: "n",
    ત: "t", થ: "th", દ: "d", ધ: "dh", ન: "n",
    પ: "p", ફ: "ph", બ: "b", ભ: "bh", મ: "m",
    ય: "y", ર: "r", લ: "l", વ: "v", ળ: "l",
    શ: "sh", ષ: "sh", સ: "s", હ: "h",
  },
  matras: {
    "ા": "aa", "િ": "i", "ી": "ee", "ુ": "u", "ૂ": "oo", "ૃ": "ri",
    "ે": "e", "ૈ": "ai", "ો": "o", "ૌ": "au",
  },
  signs: { "ં": "n", "ઁ": "n", "ઃ": "h", "઼": "" },
  virama: "્",
  inherent: "a",
  digits: { "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4", "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9" },
};

const ORIYA: BrahmicTable = {
  vowels: {
    ଅ: "a", ଆ: "aa", ଇ: "i", ଈ: "ee", ଉ: "u", ଊ: "oo", ଋ: "ri",
    ଏ: "e", ଐ: "ai", ଓ: "o", ଔ: "au",
  },
  consonants: {
    କ: "k", ଖ: "kh", ଗ: "g", ଘ: "gh", ଙ: "ng",
    ଚ: "ch", ଛ: "chh", ଜ: "j", ଝ: "jh", ଞ: "ny",
    ଟ: "t", ଠ: "th", ଡ: "d", ଢ: "dh", ଣ: "n",
    ତ: "t", ଥ: "th", ଦ: "d", ଧ: "dh", ନ: "n",
    ପ: "p", ଫ: "ph", ବ: "b", ଭ: "bh", ମ: "m",
    ଯ: "y", ର: "r", ଲ: "l", ୱ: "w", ଳ: "l",
    ଶ: "sh", ଷ: "sh", ସ: "s", ହ: "h", ଡ଼: "r", ଢ଼: "rh",
  },
  matras: {
    "ା": "aa", "ି": "i", "ୀ": "ee", "ୁ": "u", "ୂ": "oo", "ୃ": "ri",
    "େ": "e", "ୈ": "ai", "ୋ": "o", "ୌ": "au",
  },
  signs: { "ଂ": "n", "ଁ": "n", "ଃ": "h", "଼": "" },
  virama: "୍",
  inherent: "a",
  digits: { "୦": "0", "୧": "1", "୨": "2", "୩": "3", "୪": "4", "୫": "5", "୬": "6", "୭": "7", "୮": "8", "୯": "9" },
};

const TAMIL: BrahmicTable = {
  vowels: {
    அ: "a", ஆ: "aa", இ: "i", ஈ: "ee", உ: "u", ஊ: "oo",
    எ: "e", ஏ: "e", ஐ: "ai", ஒ: "o", ஓ: "o", ஔ: "au",
  },
  consonants: {
    க: "k", ங: "ng", ச: "ch", ஞ: "ny", ட: "t", ண: "n",
    த: "th", ந: "n", ப: "p", ம: "m", ய: "y", ர: "r",
    ல: "l", வ: "v", ழ: "zh", ள: "l", ற: "r", ன: "n",
    ஜ: "j", ஷ: "sh", ஸ: "s", ஹ: "h", ஶ: "sh", க்ஷ: "ksh", ஸ்ரீ: "shree",
  },
  matras: {
    "ா": "aa", "ி": "i", "ீ": "ee", "ு": "u", "ூ": "oo",
    "ெ": "e", "ே": "e", "ை": "ai", "ொ": "o", "ோ": "o", "ௌ": "au",
  },
  signs: { "ஂ": "n", "ஃ": "h" },
  virama: "்",
  inherent: "a",
  digits: { "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4", "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9" },
};

const TELUGU: BrahmicTable = {
  vowels: {
    అ: "a", ఆ: "aa", ఇ: "i", ఈ: "ee", ఉ: "u", ఊ: "oo", ఋ: "ri",
    ఎ: "e", ఏ: "e", ఐ: "ai", ఒ: "o", ఓ: "o", ఔ: "au",
  },
  consonants: {
    క: "k", ఖ: "kh", గ: "g", ఘ: "gh", ఙ: "ng",
    చ: "ch", ఛ: "chh", జ: "j", ఝ: "jh", ఞ: "ny",
    ట: "t", ఠ: "th", డ: "d", ఢ: "dh", ణ: "n",
    త: "t", థ: "th", ద: "d", ధ: "dh", న: "n",
    ప: "p", ఫ: "ph", బ: "b", భ: "bh", మ: "m",
    య: "y", ర: "r", ల: "l", వ: "v", ళ: "l", ఱ: "r",
    శ: "sh", ష: "sh", స: "s", హ: "h",
  },
  matras: {
    "ా": "aa", "ి": "i", "ీ": "ee", "ు": "u", "ూ": "oo", "ృ": "ri",
    "ె": "e", "ే": "e", "ై": "ai", "ొ": "o", "ో": "o", "ౌ": "au",
  },
  signs: { "ం": "m", "ఁ": "n", "ః": "h", "఼": "" },
  virama: "్",
  inherent: "a",
  digits: { "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4", "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9" },
};

const KANNADA: BrahmicTable = {
  vowels: {
    ಅ: "a", ಆ: "aa", ಇ: "i", ಈ: "ee", ಉ: "u", ಊ: "oo", ಋ: "ri",
    ಎ: "e", ಏ: "e", ಐ: "ai", ಒ: "o", ಓ: "o", ಔ: "au",
  },
  consonants: {
    ಕ: "k", ಖ: "kh", ಗ: "g", ಘ: "gh", ಙ: "ng",
    ಚ: "ch", ಛ: "chh", ಜ: "j", ಝ: "jh", ಞ: "ny",
    ಟ: "t", ಠ: "th", ಡ: "d", ಢ: "dh", ಣ: "n",
    ತ: "t", ಥ: "th", ದ: "d", ಧ: "dh", ನ: "n",
    ಪ: "p", ಫ: "ph", ಬ: "b", ಭ: "bh", ಮ: "m",
    ಯ: "y", ರ: "r", ಲ: "l", ವ: "v", ಳ: "l", ಱ: "r",
    ಶ: "sh", ಷ: "sh", ಸ: "s", ಹ: "h",
  },
  matras: {
    "ಾ": "aa", "ಿ": "i", "ೀ": "ee", "ು": "u", "ೂ": "oo", "ೃ": "ri",
    "ೆ": "e", "ೇ": "e", "ೈ": "ai", "ೊ": "o", "ೋ": "o", "ೌ": "au",
  },
  signs: { "ಂ": "m", "ಁ": "n", "ಃ": "h", "಼": "" },
  virama: "್",
  inherent: "a",
  digits: { "೦": "0", "೧": "1", "೨": "2", "೩": "3", "೪": "4", "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9" },
};

const MALAYALAM: BrahmicTable = {
  vowels: {
    അ: "a", ആ: "aa", ഇ: "i", ഈ: "ee", ഉ: "u", ഊ: "oo", ഋ: "ri",
    എ: "e", ഏ: "e", ഐ: "ai", ഒ: "o", ഓ: "o", ഔ: "au",
  },
  consonants: {
    ക: "k", ഖ: "kh", ഗ: "g", ഘ: "gh", ങ: "ng",
    ച: "ch", ഛ: "chh", ജ: "j", ഝ: "jh", ഞ: "ny",
    ട: "t", ഠ: "th", ഡ: "d", ഢ: "dh", ണ: "n",
    ത: "t", ഥ: "th", ദ: "d", ധ: "dh", ന: "n",
    പ: "p", ഫ: "ph", ബ: "b", ഭ: "bh", മ: "m",
    യ: "y", ര: "r", ല: "l", വ: "v", ള: "l", ഴ: "zh", റ: "r", ഩ: "n",
    ശ: "sh", ഷ: "sh", സ: "s", ഹ: "h",
    // chillu (vowel-less final) letters
    ൺ: "n", ൻ: "n", ർ: "r", ൽ: "l", ൾ: "l", ൿ: "k",
  },
  matras: {
    "ാ": "aa", "ി": "i", "ീ": "ee", "ു": "u", "ൂ": "oo", "ൃ": "ri",
    "െ": "e", "േ": "e", "ൈ": "ai", "ൊ": "o", "ോ": "o", "ൌ": "au", "ൗ": "au",
  },
  signs: { "ം": "m", "ഁ": "n", "ഃ": "h", "഻": "", "഼": "" },
  virama: "്",
  inherent: "a",
  digits: { "൦": "0", "൧": "1", "൨": "2", "൩": "3", "൪": "4", "൫": "5", "൬": "6", "൭": "7", "൮": "8", "൯": "9" },
};

const TABLES: Partial<Record<ScriptKey, BrahmicTable>> = {
  devanagari: DEVANAGARI,
  bengali: BENGALI,
  gurmukhi: GURMUKHI,
  gujarati: GUJARATI,
  oriya: ORIYA,
  tamil: TAMIL,
  telugu: TELUGU,
  kannada: KANNADA,
  malayalam: MALAYALAM,
};

/** Perso-Arabic (Urdu) has no inherent vowel — plain character mapping. */
const URDU: Record<string, string> = {
  ا: "a", آ: "aa", أ: "a", إ: "i", ب: "b", پ: "p", ت: "t", ٹ: "t",
  ث: "s", ج: "j", چ: "ch", ح: "h", خ: "kh", د: "d", ڈ: "d", ذ: "z",
  ر: "r", ڑ: "r", ز: "z", ژ: "zh", س: "s", ش: "sh", ص: "s", ض: "z",
  ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ک: "k", گ: "g",
  ل: "l", م: "m", ن: "n", ں: "n", و: "o", ہ: "h", ھ: "h", ی: "i",
  ے: "e", ئ: "i", ؤ: "o", ء: "", "۰": "0", "۱": "1", "۲": "2", "۳": "3",
  "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  // punctuation
  "،": ",", "؟": "?", "۔": ".", "؛": ";", "٪": "%",
  // harakat (short-vowel diacritics)
  "َ": "a", "ِ": "i", "ُ": "u", "ْ": "", "ّ": "", "ٰ": "a",
};

/* ------------------------------------------------------------------ */
/* Script detection                                                    */
/* ------------------------------------------------------------------ */

const SCRIPT_RANGES: Array<{ script: ScriptKey; re: RegExp }> = [
  { script: "devanagari", re: /[\u0900-\u097F]/ },
  { script: "bengali", re: /[\u0980-\u09FF]/ },
  { script: "gurmukhi", re: /[\u0A00-\u0A7F]/ },
  { script: "gujarati", re: /[\u0A80-\u0AFF]/ },
  { script: "oriya", re: /[\u0B00-\u0B7F]/ },
  { script: "tamil", re: /[\u0B80-\u0BFF]/ },
  { script: "telugu", re: /[\u0C00-\u0C7F]/ },
  { script: "kannada", re: /[\u0C80-\u0CFF]/ },
  { script: "malayalam", re: /[\u0D00-\u0D7F]/ },
  { script: "arabic", re: /[\u0600-\u06FF\u0750-\u077F]/ },
];

/**
 * Which writing system is this text actually written in?
 *
 * Picks the script with the most characters rather than the first range that
 * matches: the danda "।" (U+0964) lives in the Devanagari block, so any
 * Bengali/Assamese sentence that ends with one used to be misread as
 * Devanagari and its Roman reading came back as the native script.
 */
export function detectScript(text: string): ScriptKey {
  // Punctuation is script-neutral — never let it vote.
  const letters = text.replace(/[\u0964\u0965]/g, "");

  let best: ScriptKey = "latin";
  let bestCount = 0;
  for (const { script, re } of SCRIPT_RANGES) {
    const count = (letters.match(new RegExp(re, "gu")) ?? []).length;
    if (count > bestCount) {
      best = script;
      bestCount = count;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Romanization                                                        */
/* ------------------------------------------------------------------ */

const VOWEL_CHARS = new Set([
  "a", "e", "i", "o", "u", "A", "E", "I", "O", "U",
]);

/** Drop the word-final schwa: "kaama" → "kaam", "ghara" → "ghar". */
function fixSchwa(word: string): string {
  if (word.length < 3) return word;
  if (/aa$/.test(word)) return word;
  if (!/a$/.test(word)) return word;
  const before = word[word.length - 2];
  // keep the vowel when it is a genuine vowel ending (e.g. "chai", "hai")
  if (before && VOWEL_CHARS.has(before) && before !== "a") return word;
  return word.slice(0, -1);
}

function romanizeBrahmic(text: string, t: BrahmicTable): string {
  const chars = [...text];
  let out = "";

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]!;

    // Devanagari/Indic digits → ASCII so numbers stay readable
    const digit = t.digits[c];
    if (digit !== undefined) {
      out += digit;
      continue;
    }

    const vowel = t.vowels[c];
    if (vowel !== undefined) {
      out += vowel;
      continue;
    }

    const consonant = t.consonants[c];
    if (consonant !== undefined) {
      const next = chars[i + 1];
      // Consonant cluster: क् + त → "kta", never "kata"
      if (next === t.virama) {
        out += consonant;
        i++;
        continue;
      }
      // Dependent vowel replaces the inherent vowel
      if (next !== undefined && t.matras[next] !== undefined) {
        out += consonant + t.matras[next];
        i++;
        continue;
      }
      out += consonant + t.inherent;
      continue;
    }

    const matra = t.matras[c];
    if (matra !== undefined) {
      out += matra;
      continue;
    }

    const sign = t.signs[c];
    if (sign !== undefined) {
      out += sign;
      continue;
    }

    if (c === t.virama) continue;

    // Danda / double danda → sentence punctuation
    if (c === "।") {
      out += ".";
      continue;
    }
    if (c === "॥") {
      out += ".";
      continue;
    }

    out += c;
  }

  // Apply schwa deletion word by word, keeping punctuation intact
  return out
    .split(/(\s+)/)
    .map((chunk) =>
      /\s/.test(chunk)
        ? chunk
        : chunk.replace(/[A-Za-z]+/g, (w) => fixSchwa(w))
    )
    .join("");
}

function romanizeUrdu(text: string): string {
  let out = "";
  for (const c of [...text]) {
    out += URDU[c] ?? c;
  }
  return out;
}

/**
 * Transliterate any supported Indic text into Roman/English script.
 * Latin input (and punctuation, emoji, numbers) passes through untouched.
 */
export function romanize(text: string): string {
  if (!text) return "";
  const script = detectScript(text);
  if (script === "latin") return text;
  if (script === "arabic") return romanizeUrdu(text);
  const table = TABLES[script];
  return table ? romanizeBrahmic(text, table) : text;
}

/**
 * Romanize text that we already know the language of (used when the text
 * mixes scripts — e.g. a Hindi reply containing English brand names).
 */
export function romanizeFor(text: string, langCode: string): string {
  if (getLang(langCode).script === "latin") return text;
  return romanize(text);
}

/** True when the string contains at least one letter of a non-Latin script. */
export function hasIndicScript(text: string): boolean {
  return detectScript(text) !== "latin";
}
