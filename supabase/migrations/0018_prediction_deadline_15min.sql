-- Change prediction visibility deadline from 1 hour to 15 minutes before kickoff

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
   OR m.kickoff_at <= now() + INTERVAL '15 minutes';

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
   OR m.kickoff_at <= now() + INTERVAL '15 minutes'
ORDER BY pr.created_at DESC;
