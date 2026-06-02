-- ============================================================
-- LexiLearn – Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. exercise_attempts
--    One row per completed exercise (speech, reading, or game)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT    NOT NULL CHECK (type IN ('speech', 'reading', 'game')),
  level           INTEGER NOT NULL DEFAULT 1,
  score           REAL    NOT NULL DEFAULT 0,          -- 0-100 composite
  accuracy        REAL    DEFAULT NULL,                -- word-level accuracy %
  correctness     REAL    DEFAULT NULL,                -- exact-match correctness %
  response_time   REAL    DEFAULT NULL,                -- seconds
  expected_text   TEXT    DEFAULT NULL,
  spoken_text     TEXT    DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_attempts_user_created
  ON exercise_attempts (user_id, created_at DESC);

-- Row Level Security
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own attempts"
  ON exercise_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own attempts"
  ON exercise_attempts FOR SELECT
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 2. progress_summary
--    One row per user – upserted after each session
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_summary (
  user_id             UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points        INTEGER NOT NULL DEFAULT 0,
  lessons_completed   INTEGER NOT NULL DEFAULT 0,
  avg_accuracy        REAL    NOT NULL DEFAULT 0,
  streak_days         INTEGER NOT NULL DEFAULT 0,
  last_active_date    DATE    DEFAULT NULL,
  reading_level       INTEGER NOT NULL DEFAULT 1,
  speech_level        INTEGER NOT NULL DEFAULT 1,
  game_level          INTEGER NOT NULL DEFAULT 1,
  badges              TEXT[]  NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE progress_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upsert their own summary"
  ON progress_summary FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 3. learning_sessions
--    One row per app session (optional analytics)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_sessions (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ DEFAULT NULL,
  duration_s  INTEGER DEFAULT NULL              -- seconds
);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
  ON learning_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
