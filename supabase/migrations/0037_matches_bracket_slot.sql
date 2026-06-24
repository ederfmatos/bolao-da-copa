-- Migration: Add bracket_slot column to matches table
-- Purpose: Link knockout stage matches to their bracket slot (R16_01, QF_02, FINAL, etc.)
-- Populated by sync-matches during knockout phase synchronization
-- Used by calculateBracketPoints for partial credit algorithm

-- ============================================================================
-- ADD BRACKET_SLOT COLUMN
-- ============================================================================
-- Nullable column: group-stage matches will have NULL, knockout matches will have slot identifier
ALTER TABLE matches ADD COLUMN bracket_slot TEXT;

-- ============================================================================
-- CREATE PARTIAL INDEX
-- ============================================================================
-- Index only knockout matches (bracket_slot IS NOT NULL) for efficient queries
CREATE INDEX IF NOT EXISTS idx_matches_bracket_slot
  ON matches(bracket_slot)
  WHERE bracket_slot IS NOT NULL;
