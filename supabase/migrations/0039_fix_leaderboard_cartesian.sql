-- Bolão Copa 2026 - Migration 0039
-- Fix leaderboard view: pre-aggregate bracket_predictions and scorer_predictions
-- to avoid cartesian product with predictions, which inflated group_points.

DROP VIEW IF EXISTS leaderboard CASCADE;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id                                                  AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0)                           AS group_points,
  COALESCE(MAX(bp.bracket_points_total), 0)             AS bracket_points,
  COALESCE(MAX(sp.scorer_points), 0)                    AS scorer_points,
  COALESCE(SUM(pr.points), 0)
    + COALESCE(MAX(bp.bracket_points_total), 0)
    + COALESCE(MAX(sp.scorer_points), 0)                AS total_points,
  COUNT(pr.id)                                          AS total_predictions,
  COUNT(CASE WHEN pr.points = 10 THEN 1 END)            AS exact_score_count,
  COUNT(CASE WHEN pr.points =  7 THEN 1 END)            AS winner_with_diff_count,
  COUNT(CASE WHEN pr.points =  3 THEN 1 END)            AS winner_correct_count
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(bracket_points) AS bracket_points_total
  FROM bracket_predictions
  GROUP BY user_id
) bp ON bp.user_id = p.id
LEFT JOIN scorer_predictions sp ON sp.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY
  total_points DESC,
  exact_score_count DESC,
  winner_with_diff_count DESC,
  winner_correct_count DESC,
  p.name ASC;
