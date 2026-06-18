-- Bolão Copa 2026 - Migration 0028
-- Add photo_url column to scorer_players

ALTER TABLE scorer_players ADD COLUMN IF NOT EXISTS photo_url TEXT;
