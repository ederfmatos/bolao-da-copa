-- Bolão Copa 2026 - Restrict prediction visibility before deadline
-- Other users' predictions are only visible after the 1-hour deadline has passed.
-- Own predictions are always visible.

CREATE OR REPLACE VIEW match_predictions AS
SELECT
  pr.id AS prediction_id,
  pr.match_id,
  pr.user_id,
  pr.home_score,
  pr.away_score,
  pr.points,
  pr.created_at,
  pr.updated_at,
  p.name AS user_name,
  p.avatar_url AS user_avatar_url
FROM predictions pr
JOIN profiles p ON p.id = pr.user_id
JOIN matches m ON m.id = pr.match_id
WHERE pr.user_id = auth.uid()
   OR m.kickoff_at <= now() + INTERVAL '1 hour';

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
WHERE pr.user_id = auth.uid()
   OR m.kickoff_at <= now() + INTERVAL '1 hour'
ORDER BY pr.created_at DESC;
