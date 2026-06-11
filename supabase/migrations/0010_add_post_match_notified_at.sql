-- Migration 0010: Add post_match_notified_at column for tracking notification status
ALTER TABLE matches ADD COLUMN IF NOT EXISTS post_match_notified_at TIMESTAMPTZ;
