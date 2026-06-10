-- Bolão Copa 2026 - User Predictions View Migration
-- Creates a view that joins predictions with matches for user profile pages.

CREATE OR REPLACE VIEW user_predictions AS
SELECT
  pr.id AS prediction_id,
  pr.user_id,
  pr.match_id,
  pr.home_score AS predicted_home,
  pr.away_score AS predicted_away,
  pr.points,
  pr.created_at,
  m.home_team,
  m.away_team,
  m.home_flag,
  m.away_flag,
  m.group_name,
  m.kickoff_at,
  m.status AS match_status,
  m.home_score AS actual_home,
  m.away_score AS actual_away
FROM predictions pr
JOIN matches m ON m.id = pr.match_id
ORDER BY pr.created_at DESC;
