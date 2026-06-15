-- Bolão Copa 2026 - Migration 0017
-- Creates bonus_predictions table, RLS policies, and updates leaderboard view
-- to include bonus points from the final standings prediction.

-- ============================================================================
-- BONUS PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bonus_predictions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_place  TEXT NOT NULL,
  second_place TEXT NOT NULL,
  third_place  TEXT NOT NULL,
  fourth_place TEXT NOT NULL,
  bonus_points SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_bonus_predictions_user ON bonus_predictions (user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE bonus_predictions ENABLE ROW LEVEL SECURITY;

-- Own row always readable
DROP POLICY IF EXISTS "bonus_read_own" ON bonus_predictions;
CREATE POLICY "bonus_read_own" ON bonus_predictions
  FOR SELECT USING (auth.uid() = user_id);

-- Others' rows readable only after deadline (2026-06-18T16:00:00Z / 13:00 BRT)
DROP POLICY IF EXISTS "bonus_read_others_after_deadline" ON bonus_predictions;
CREATE POLICY "bonus_read_others_after_deadline" ON bonus_predictions
  FOR SELECT USING (
    now() >= '2026-06-18T16:00:00+00'::timestamptz
  );

-- Insert only before deadline
DROP POLICY IF EXISTS "bonus_insert_before_deadline" ON bonus_predictions;
CREATE POLICY "bonus_insert_before_deadline" ON bonus_predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    now() < '2026-06-18T16:00:00+00'::timestamptz
  );

-- Update only before deadline
DROP POLICY IF EXISTS "bonus_update_before_deadline" ON bonus_predictions;
CREATE POLICY "bonus_update_before_deadline" ON bonus_predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    now() < '2026-06-18T16:00:00+00'::timestamptz
  );

-- ============================================================================
-- UPDATE LEADERBOARD VIEW WITH BONUS POINTS
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0)
    + COALESCE(MAX(bp.bonus_points), 0)               AS total_points,
  COUNT(pr.id)                                         AS total_predictions,
  COUNT(CASE WHEN pr.points = 10 THEN 1 END)           AS exact_score_count,
  COUNT(CASE WHEN pr.points =  7 THEN 1 END)           AS winner_with_diff_count,
  COUNT(CASE WHEN pr.points =  3 THEN 1 END)           AS winner_correct_count
FROM profiles p
LEFT JOIN predictions      pr ON pr.user_id = p.id
LEFT JOIN bonus_predictions bp ON bp.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY
  total_points DESC,
  exact_score_count DESC,
  winner_with_diff_count DESC,
  winner_correct_count DESC,
  p.name ASC;
