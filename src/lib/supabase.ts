/**
 * Supabase client and database helpers for Bhasha AI.
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Interacts with `translation_history` table for persistent storage of voice translations.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TranslationResult } from "./agent";
import type { LangCode } from "./languages";

export type Database = {
  public: {
    Tables: {
      translation_history: {
        Row: {
          id: number;
          created_at: string;
          source_lang: string;
          target_lang: string;
          original_text: string;
          translated_text: string;
          transliteration: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          source_lang: string;
          target_lang: string;
          original_text: string;
          translated_text: string;
          transliteration?: string | null;                               
        };
        Update: {
          id?: number;
          created_at?: string;
          source_lang?: string;
          target_lang?: string;
          original_text?: string;
          translated_text?: string;
          transliteration?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TranslationHistoryInsert = {
  source_lang: string;
  target_lang: string;
  original_text: string;
  translated_text: string;
  transliteration?: string | null;
};

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) return null;

  client = createClient<Database>(url, anonKey);
  return client;
}

export const supabase = getSupabase();

/**
 * Insert a successful translation into translation_history table.
 */
export async function saveTranslationHistory(
  data: TranslationHistoryInsert
): Promise<boolean> {
  try {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb.from("translation_history").insert({
      source_lang: data.source_lang,
      target_lang: data.target_lang,
      original_text: data.original_text,
      translated_text: data.translated_text,
      transliteration: data.transliteration ?? null,
    });

    if (error) {
      console.warn("Supabase insert error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase insert exception:", err);
    return false;
  }
}

// Backward compatibility alias
export const saveTranslation = saveTranslationHistory;

/**
 * Fetch the last 10 entries from translation_history table.
 */
export async function fetchRecentTranslations(
  limit = 10
): Promise<TranslationResult[]> {
  try {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
      .from("translation_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      if (error) console.warn("Supabase fetch error:", error.message);
      return [];
    }

    return data.map((row) => ({
      id: `db-${row.id}`,
      original: row.original_text,
      originalTransliteration: "",
      translated: row.translated_text,
      transliteration: row.transliteration || "",
      from: (row.source_lang || "hi") as LangCode,
      to: (row.target_lang || "en") as LangCode,
      engine: "gemini" as const,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));
  } catch (err) {
    console.warn("Supabase fetch exception:", err);
    return [];
  }
}
