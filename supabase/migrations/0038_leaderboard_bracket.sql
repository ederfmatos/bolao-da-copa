-- Bolão Copa 2026 - Migration 0038
-- Updates leaderboard view to expose group_points and bracket_points as separate columns,
-- removes the bonus_predictions JOIN (retired per ADR-003), and recalculates
-- total_points as group_points + bracket_points + scorer_points.
--
-- Related ADRs:
--   ADR-001: Bracket Editável com Pontos de Mata-Mata Separados no Placar
--   ADR-003: Substituição Completa do Sistema de Previsão Final

-- ============================================================================
-- UPDATE LEADERBOARD VIEW WITH BRACKET POINTS
-- ============================================================================
DROP VIEW IF EXISTS leaderboard CASCADE;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id                                                  AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0)                           AS group_points,
  COALESCE(SUM(bp.bracket_points), 0)                   AS bracket_points,
  COALESCE(MAX(sp.scorer_points), 0)                    AS scorer_points,
  COALESCE(SUM(pr.points), 0)
    + COALESCE(SUM(bp.bracket_points), 0)
    + COALESCE(MAX(sp.scorer_points), 0)                AS total_points,
  COUNT(pr.id)                                          AS total_predictions,
  COUNT(CASE WHEN pr.points = 10 THEN 1 END)            AS exact_score_count,
  COUNT(CASE WHEN pr.points =  7 THEN 1 END)            AS winner_with_diff_count,
  COUNT(CASE WHEN pr.points =  3 THEN 1 END)            AS winner_correct_count
FROM profiles p
LEFT JOIN predictions        pr ON pr.user_id = p.id
LEFT JOIN bracket_predictions bp ON bp.user_id = p.id
LEFT JOIN scorer_predictions  sp ON sp.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY
  total_points DESC,
  exact_score_count DESC,
  winner_with_diff_count DESC,
  winner_correct_count DESC,
  p.name ASC;
