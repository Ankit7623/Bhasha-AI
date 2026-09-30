/**
 * Offline phrasebook — the translator's fail-safe.
 *
 * When Gemini is unreachable (no key, quota, airplane mode, hackathon wifi),
 * Bhasha AI still translates the phrases a traveller actually says. Anything
 * outside this table falls back to transliteration-only mode, clearly labelled
 * "OFFLINE" in the UI, so the demo never shows a dead screen.
 */

import type { LangCode } from "./languages";

export type PhraseEntry = {
  id: string;
  /** English anchor — also used for fuzzy matching when speaking English */
  phrase: Record<LangCode, string>;
};

export const PHRASES: PhraseEntry[] = [
  {
    id: "greeting",
    phrase: {
      hi: "नमस्ते, आप कैसे हैं?",
      mr: "नमस्कार, तुम्ही कसे आहात?",
      bn: "নমস্কার, আপনি কেমন আছেন?",
      ta: "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?",
      te: "నమస్కారం, మీరు ఎలా ఉన్నారు?",
      gu: "નમસ્તે, તમે કેમ છો?",
      kn: "ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?",
      ml: "നമസ്കാരം, നിങ്ങൾ എങ്ങനെയുണ്ട്?",
      pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?",
      or: "ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?",
      as: "নমস্কাৰ, আপুনি কেনে আছে?",
      ur: "سلام، آپ کیسے ہیں؟",
      en: "Hello, how are you?",
    },
  },
  {
    id: "thanks",
    phrase: {
      hi: "बहुत धन्यवाद",
      mr: "खूप धन्यवाद",
      bn: "অনেক ধন্যবাদ",
      ta: "மிக்க நன்றி",
      te: "చాలా ధన్యవాదాలు",
      gu: "ખૂબ આભાર",
      kn: "ತುಂಬಾ ಧನ್ಯವಾದಗಳು",
      ml: "വളരെ നന്ദി",
      pa: "ਬਹੁਤ ਧੰਨਵਾਦ",
      or: "ବହୁତ ଧନ୍ୟବାଦ",
      as: "বহুত ধন্যবাদ",
      ur: "بہت شکریہ",
      en: "Thank you very much",
    },
  },
  {
    id: "station",
    phrase: {
      hi: "रेलवे स्टेशन कहाँ है?",
      mr: "रेल्वे स्टेशन कुठे आहे?",
      bn: "রেলওয়ে স্টেশন কোথায়?",
      ta: "ரயில் நிலையம் எங்கே இருக்கிறது?",
      te: "రైల్వే స్టేషన్ ఎక్కడ ఉంది?",
      gu: "રેલવે સ્ટેશન ક્યાં છે?",
      kn: "ರೈಲ್ವೆ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?",
      ml: "റെയിൽവേ സ്റ്റേഷൻ എവിടെയാണ്?",
      pa: "ਰੇਲਵੇ ਸਟੇਸ਼ਨ ਕਿੱਥੇ ਹੈ?",
      or: "ରେଳ ଷ୍ଟେସନ କେଉଁଠି ଅଛି?",
      as: "ৰেল ষ্টেচন ক'ত?",
      ur: "ریلوے اسٹیشن کہاں ہے؟",
      en: "Where is the railway station?",
    },
  },
  {
    id: "price",
    phrase: {
      hi: "यह कितने का है?",
      mr: "हे किती रुपयांचे आहे?",
      bn: "এটার দাম কত?",
      ta: "இதன் விலை என்ன?",
      te: "దీని ధర ఎంత?",
      gu: "આની કિંમત કેટલી છે?",
      kn: "ಇದರ ಬೆಲೆ ಎಷ್ಟು?",
      ml: "ഇതിന് എത്ര വിലയാണ്?",
      pa: "ਇਸਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?",
      or: "ଏହାର ଦାମ କେତେ?",
      as: "ইয়াৰ দাম কিমান?",
      ur: "اس کی قیمت کتنی ہے؟",
      en: "How much does this cost?",
    },
  },
  {
    id: "help",
    phrase: {
      hi: "कृपया मेरी मदद करें",
      mr: "कृपया मला मदत करा",
      bn: "দয়া করে আমাকে সাহায্য করুন",
      ta: "தயவுசெய்து எனக்கு உதவுங்கள்",
      te: "దయచేసి నాకు సహాయం చేయండి",
      gu: "મહેરબાની કરીને મને મદદ કરો",
      kn: "ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ",
      ml: "ദയവായി എന്നെ സഹായിക്കൂ",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਮੇਰੀ ਮਦਦ ਕਰੋ",
      or: "ଦୟାକରି ମୋତେ ସାହାଯ୍ୟ କରନ୍ତୁ",
      as: "অনুগ্ৰহ কৰি মোক সহায় কৰক",
      ur: "براہ کرم میری مدد کریں",
      en: "Please help me",
    },
  },
  {
    id: "doctor",
    phrase: {
      hi: "मुझे डॉक्टर की जरूरत है",
      mr: "मला डॉक्टरची गरज आहे",
      bn: "আমার ডাক্তার দরকার",
      ta: "எனக்கு ஒரு மருத்துவர் தேவை",
      te: "నాకు డాక్టర్ కావాలి",
      gu: "મને ડૉક્ટરની જરૂર છે",
      kn: "ನನಗೆ ವೈದ್ಯರ ಅಗತ್ಯವಿದೆ",
      ml: "എനിക്ക് ഒരു ഡോക്ടറെ വേണം",
      pa: "ਮੈਨੂੰ ਡਾਕਟਰ ਦੀ ਲੋੜ ਹੈ",
      or: "ମୋତେ ଡାକ୍ତର ଦରକାର",
      as: "মোক এজন ডাক্তৰৰ প্ৰয়োজন",
      ur: "مجھے ڈاکٹر کی ضرورت ہے",
      en: "I need a doctor",
    },
  },
  {
    id: "water",
    phrase: {
      hi: "कृपया मुझे पानी दीजिए",
      mr: "कृपया मला पाणी द्या",
      bn: "দয়া করে আমাকে একটু জল দিন",
      ta: "தயவுசெய்து எனக்கு தண்ணீர் கொடுங்கள்",
      te: "దయచేసి నాకు కొంచెం నీళ్లు ఇవ్వండి",
      gu: "મહેરબાની કરીને મને પાણી આપો",
      kn: "ದಯವಿಟ್ಟು ನನಗೆ ಸ್ವಲ್ಪ ನೀರು ಕೊಡಿ",
      ml: "ദയവായി എനിക്ക് കുറച്ച് വെള്ളം തരൂ",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਪਾਣੀ ਦਿਓ",
      or: "ଦୟାକରି ମୋତେ ଟିକେ ପାଣି ଦିଅନ୍ତୁ",
      as: "অনুগ্ৰহ কৰি মোক অলপ পানী দিয়ক",
      ur: "براہ کرم مجھے پانی دیں",
      en: "Please give me some water",
    },
  },
  {
    id: "name",
    phrase: {
      hi: "आपका नाम क्या है?",
      mr: "तुमचे नाव काय आहे?",
      bn: "আপনার নাম কী?",
      ta: "உங்கள் பெயர் என்ன?",
      te: "మీ పేరు ఏమిటి?",
      gu: "તમારું નામ શું છે?",
      kn: "ನಿಮ್ಮ ಹೆಸರು ಏನು?",
      ml: "നിങ്ങളുടെ പേര് എന്താണ്?",
      pa: "ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?",
      or: "ଆପଣଙ୍କ ନାମ କଣ?",
      as: "আপোনাৰ নাম কি?",
      ur: "آپ کا نام کیا ہے؟",
      en: "What is your name?",
    },
  },
  {
    id: "morning",
    phrase: {
      hi: "सुप्रभात",
      mr: "सुप्रभात",
      bn: "শুভ সকাল",
      ta: "காலை வணக்கம்",
      te: "శుభోదయం",
      gu: "સુપ્રભાત",
      kn: "ಶುಭೋದಯ",
      ml: "സുപ്രഭാതം",
      pa: "ਸ਼ੁਭ ਸਵੇਰ",
      or: "ଶୁଭ ସକାଳ",
      as: "শুভ ৰাতিপুৱা",
      ur: "صبح بخیر",
      en: "Good morning",
    },
  },
  {
    id: "farewell",
    phrase: {
      hi: "फिर मिलेंगे",
      mr: "पुन्हा भेटू",
      bn: "আবার দেখা হবে",
      ta: "மீண்டும் சந்திப்போம்",
      te: "మళ్ళీ కలుద్దాం",
      gu: "ફરી મળીશું",
      kn: "ಮತ್ತೆ ಸಿಗುತ್ತೇವೆ",
      ml: "വീണ്ടും കാണാം",
      pa: "ਫਿਰ ਮਿਲਾਂਗੇ",
      or: "ପୁଣି ଭେଟିବା",
      as: "পুনৰ লগ পাম",
      ur: "پھر ملیں گے",
      en: "See you again",
    },
  },
];

/** Lowercase, drop punctuation, collapse whitespace. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:।॥'"“”‘’\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Look up a phrase in the offline book.
 * Matches the exact wording in the source language, or a containment match
 * (so "please give me some water now" still hits "please give me some water").
 */
export function lookupPhrase(
  text: string,
  from: LangCode,
  to: LangCode
): string | null {
  if (from === to) return text.trim() || null;
  const needle = normalize(text);
  if (!needle) return null;

  // Exact matches always win; containment is only a fallback for longer
  // sentences ("hello, how are you today?" → the greeting phrase).
  let best: { rank: number; length: number; value: string } | null = null;

  for (const entry of PHRASES) {
    const values = Object.values(entry.phrase).map(normalize);
    const anchor = normalize(entry.phrase[from]);

    const rank = values.includes(needle)
      ? 2
      : anchor.length > 4 && needle.includes(anchor)
        ? 1
        : 0;

    if (rank === 0) continue;

    const value = entry.phrase[to];
    const length = normalize(value).length;
    if (!best || rank > best.rank || (rank === best.rank && length > best.length)) {
      best = { rank, length, value };
    }
  }

  return best?.value ?? null;
}
