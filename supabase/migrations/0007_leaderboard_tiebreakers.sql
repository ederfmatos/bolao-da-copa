-- Bolão Copa 2026 - Migration 0007
-- Adds tiebreaker columns to leaderboard view for proper ranking when points are equal

-- ============================================================================
-- UPDATE LEADERBOARD VIEW WITH TIEBREAKERS
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COUNT(pr.id) AS total_predictions,
  COUNT(CASE WHEN pr.points = 10 THEN 1 END) AS exact_score_count,
  COUNT(CASE WHEN pr.points = 7 THEN 1 END) AS winner_with_diff_count,
  COUNT(CASE WHEN pr.points = 3 THEN 1 END) AS winner_correct_count
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY
  total_points DESC,
  exact_score_count DESC,
  winner_with_diff_count DESC,
  winner_correct_count DESC,
  p.name ASC;
