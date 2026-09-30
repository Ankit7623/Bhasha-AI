-- =============================================================
-- Bhasha AI — Translation History Table
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- =============================================================

CREATE TABLE IF NOT EXISTS translation_history (
  id            BIGSERIAL     PRIMARY KEY,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  source_lang   TEXT          NOT NULL,
  target_lang   TEXT          NOT NULL,
  original_text TEXT          NOT NULL,
  translated_text TEXT        NOT NULL,
  transliteration TEXT
);

-- Index for listing recent translations quickly
CREATE INDEX IF NOT EXISTS idx_translation_history_created
  ON translation_history (created_at DESC);

-- Enable Row Level Security (Supabase best practice)
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;

-- Allow the service_role key (used by our API route) full access
CREATE POLICY "Service role full access"
  ON translation_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
