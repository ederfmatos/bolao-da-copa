-- Bolão Copa 2026 - Migration 0022
-- Creates scorer_predictions table, RLS policies, and updates leaderboard view
-- to include scorer_points from the top scorer prediction.
--
-- SCORER_DEADLINE: 2026-06-12T00:00:00Z (tournament start)
-- Must match SCORER_DEADLINE in src/lib/bracketData.js

-- ============================================================================
-- SCORER PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS scorer_predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES scorer_players(id),
  scorer_points SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_scorer_predictions_user ON scorer_predictions (user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE scorer_predictions ENABLE ROW LEVEL SECURITY;

-- Own row always readable
DROP POLICY IF EXISTS "scorer_read_own" ON scorer_predictions;
CREATE POLICY "scorer_read_own" ON scorer_predictions
  FOR SELECT USING (auth.uid() = user_id);

-- Others' rows readable only after deadline (2026-06-12T00:00:00Z / tournament start)
DROP POLICY IF EXISTS "scorer_read_others_after_deadline" ON scorer_predictions;
CREATE POLICY "scorer_read_others_after_deadline" ON scorer_predictions
  FOR SELECT USING (
    now() >= '2026-06-12T00:00:00+00'::timestamptz
  );

-- Insert only before deadline
DROP POLICY IF EXISTS "scorer_insert_before_deadline" ON scorer_predictions;
CREATE POLICY "scorer_insert_before_deadline" ON scorer_predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    now() < '2026-06-12T00:00:00+00'::timestamptz
  );

-- Update only before deadline
DROP POLICY IF EXISTS "scorer_update_before_deadline" ON scorer_predictions;
CREATE POLICY "scorer_update_before_deadline" ON scorer_predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    now() < '2026-06-12T00:00:00+00'::timestamptz
  );

-- ============================================================================
-- UPDATE LEADERBOARD VIEW WITH SCORER POINTS
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0)
    + COALESCE(MAX(bp.bonus_points), 0)
    + COALESCE(MAX(sp.scorer_points), 0)      AS total_points,
  COUNT(pr.id)                                 AS total_predictions,
  COUNT(CASE WHEN pr.points = 10 THEN 1 END)   AS exact_score_count,
  COUNT(CASE WHEN pr.points =  7 THEN 1 END)   AS winner_with_diff_count,
  COUNT(CASE WHEN pr.points =  3 THEN 1 END)   AS winner_correct_count
FROM profiles p
LEFT JOIN predictions        pr ON pr.user_id = p.id
LEFT JOIN bonus_predictions  bp ON bp.user_id = p.id
LEFT JOIN scorer_predictions sp ON sp.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY
  total_points DESC,
  exact_score_count DESC,
  winner_with_diff_count DESC,
  winner_correct_count DESC,
  p.name ASC;
