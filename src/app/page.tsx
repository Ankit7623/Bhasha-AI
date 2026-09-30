import { TranslatorApp } from "@/components/TranslatorApp";

/**
 * Server component entry point.
 *
 * GEMINI_API_KEY is a server-only variable, so the browser can never read it —
 * reading it inside the client tree caused a hydration mismatch (server HTML
 * said "voice is live", client HTML said "key missing"). Resolve it here and
 * hand the client a plain boolean instead.
 */
export default function Page() {
  return <TranslatorApp hasGeminiKey={Boolean(process.env.GEMINI_API_KEY)} />;
}
