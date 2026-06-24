-- Bolão Copa 2026 - Migration 0036
-- Creates bracket_predictions table, RLS policies, column grants, and updated_at trigger.
-- Each row stores one user's predicted winner for one bracket slot.
-- RLS deadline is derived dynamically from the earliest '16 Avos' match.

-- ============================================================================
-- BRACKET PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bracket_slot     TEXT NOT NULL,
  predicted_winner TEXT NOT NULL,
  bracket_points   SMALLINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, bracket_slot)
);

CREATE INDEX IF NOT EXISTS idx_bracket_predictions_user ON bracket_predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_bracket_predictions_slot ON bracket_predictions (bracket_slot);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COLUMN-LEVEL PRIVILEGES
-- bracket_points is server-only (written by sync-matches Edge Function)
-- ============================================================================
REVOKE INSERT ON bracket_predictions FROM authenticated;
REVOKE UPDATE ON bracket_predictions FROM authenticated;

GRANT INSERT (user_id, bracket_slot, predicted_winner) ON bracket_predictions TO authenticated;
GRANT UPDATE (user_id, bracket_slot, predicted_winner) ON bracket_predictions TO authenticated;

-- ============================================================================
-- RLS POLICIES (3 policies: INSERT, UPDATE, SELECT)
-- Deadline derived dynamically from first '16 Avos' match
-- ============================================================================

-- INSERT: only owner, only before deadline
DROP POLICY IF EXISTS "bracket_insert_before_deadline" ON bracket_predictions;
CREATE POLICY "bracket_insert_before_deadline" ON bracket_predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND now() < (
      SELECT MIN(kickoff_at) - INTERVAL '15 minutes'
      FROM matches WHERE group_name = '16 Avos'
    )
  );

-- UPDATE: only owner, only before deadline
DROP POLICY IF EXISTS "bracket_update_before_deadline" ON bracket_predictions;
CREATE POLICY "bracket_update_before_deadline" ON bracket_predictions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    now() < (
      SELECT MIN(kickoff_at) - INTERVAL '15 minutes'
      FROM matches WHERE group_name = '16 Avos'
    )
  );

-- SELECT: own rows always, others only after deadline
DROP POLICY IF EXISTS "bracket_select" ON bracket_predictions;
CREATE POLICY "bracket_select" ON bracket_predictions
  FOR SELECT USING (
    auth.uid() = user_id
    OR now() >= (
      SELECT MIN(kickoff_at) - INTERVAL '15 minutes'
      FROM matches WHERE group_name = '16 Avos'
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Uses existing set_updated_at() function (created in migration 0020)
-- ============================================================================
DROP TRIGGER IF EXISTS bracket_predictions_set_updated_at ON bracket_predictions;
CREATE TRIGGER bracket_predictions_set_updated_at
  BEFORE UPDATE ON bracket_predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
