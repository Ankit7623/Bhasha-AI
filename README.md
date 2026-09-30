# 🎙️ Bhasha AI — Universal Indic Voice Translator

An ultra-sleek, mobile-first, pure-black voice translator for India. Speak in
any of **12+ Indian languages** and Bhasha AI instantly shows the translation
in the target language's **native script**, a **Roman transliteration**, and
speaks it aloud — with WhatsApp share and copy built in.

```
Hindi  →  Tamil
"नमस्ते, आप कैसे हैं?"  →  "வணக்கம், நீங்கள் எல்லாம் எப்படி இருக்கிறீர்கள்?"
(vanakkam, neengkal eppati irukkireerkal?)
```

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 on a phone-sized viewport. Allow microphone access
and tap the mic to record a phrase. Voice transcription requires
`GEMINI_API_KEY`; recordings are uploaded to Gemini. Typed text can use the
MyMemory fallback without a key.

## The five core components

| Component                     | What it does                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Header`                      | **Bhasha AI** wordmark + glowing "Universal Indic Voice Agent" badge                                                          |
| `LanguageSelector`            | **I Speak** dropdown (default Hindi) ⇄ **Translate To** dropdown, plus an auto-speak toggle                                   |
| `MicButton`                   | Large glowing mic with pulsing rings, live equalizer while listening and a spinner while translating                          |
| `TranslationCard`             | Dual-text visual summary: original voice input, translation in native script, Roman transliteration, and **Play Audio Voice** |
| `ActionBar` + `HistoryDrawer` | **Share on WhatsApp** / **Copy Text**, and a collapsible bottom sheet of recent voice translations                            |

## Languages

Hindi · Marathi · Bengali · Tamil · Telugu · Gujarati · Kannada · Malayalam ·
Punjabi · Odia · Assamese · Urdu · English — each with its own speech locale,
writing system and transliteration table.

## Voice translation

The mic records audio in the browser. Tap it again to stop; the recording is
sent to `/api/transcribe` for transcription, then the transcript is translated
and shown in the summary card. A Gemini API key is required for transcription.
If the key is missing or transcription fails, the app reports an error and
keeps typed translation available.

Auto-speak is on by default: the translation is read aloud in the target
language as soon as it lands. Toggle it off for silent translation.

## Enable live translation (optional)

Without a key, Bhasha AI first tries the public MyMemory translation service,
then falls back to a **built-in offline phrasebook** (10 traveller phrases ×
13 languages). Online providers receive submitted text; do not send sensitive
content.

For live, unlimited translation:

1. Get a free key: https://aistudio.google.com/apikey
2. ```bash
   cp .env.example .env.local
   ```
3. Set `GEMINI_API_KEY` in `.env.local`, then restart `npm run dev`.
4. The badge flips to **Gemini live** and `/api/translate` uses the current
   Gemini Flash model, with a previous stable Flash model as a fallback.

## How the fail-safes work

| Failure                                     | Behaviour                                               |
| ------------------------------------------- | ------------------------------------------------------- |
| `GEMINI_API_KEY` missing                    | MyMemory text translation; voice reports setup required |
| Gemini quota / network / bad JSON           | MyMemory translation, then phrasebook fallback          |
| MyMemory unavailable or no confident result | Phrasebook match or clearly labelled offline echo       |
| Microphone permission blocked               | Red mic state and permission guidance                   |
| TTS unavailable or no voice for a language  | Notice shown; text and share still work                 |

## Transliteration

`src/lib/translit.ts` romanizes text from ten Indic scripts — Devanagari,
Bengali, Gurmukhi, Gujarati, Odia, Tamil, Telugu, Kannada, Malayalam and
Perso-Arabic (Urdu) — using a table-driven Brahmic algorithm (consonant +
inherent vowel, matras, virama clusters) plus word-final schwa deletion, so
`राम काम` → `raam kaam`.

## API — `POST /api/translate`

```jsonc
// Request
{ "text": "नमस्ते, आप कैसे हैं?", "from": "hi", "to": "ta" }

// Response — always 200 with ok:true
{
  "ok": true,
  "engine": "gemini",            // or "mymemory" / "offline"
  "data": {
    "translation": "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?",
    "detectedSourceLanguage": "Hindi",
    "note": ""
  }
}
```

Voice clips are posted as `multipart/form-data` to `POST /api/transcribe`.
This route needs `GEMINI_API_KEY` and sends microphone audio to Gemini for
transcription.

## Stack

Next.js 15 (App Router) · Tailwind CSS v4 · Framer Motion · Lucide ·
MediaRecorder · Google Gemini audio transcription · MyMemory translation
