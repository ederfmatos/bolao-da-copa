-- Bolão Copa 2026 - Migration 0027
-- View group_standings computed from matches table (no extra sync needed)

CREATE OR REPLACE VIEW group_standings AS
WITH all_teams AS (
  SELECT DISTINCT group_name, home_team AS team, home_flag AS flag
  FROM matches WHERE group_name LIKE 'Grupo%'
  UNION
  SELECT DISTINCT group_name, away_team, away_flag
  FROM matches WHERE group_name LIKE 'Grupo%'
),
results AS (
  SELECT group_name, home_team AS team,
    1 AS played,
    CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS won,
    CASE WHEN home_score = away_score THEN 1 ELSE 0 END AS drawn,
    CASE WHEN home_score < away_score THEN 1 ELSE 0 END AS lost,
    home_score AS gf, away_score AS ga
  FROM matches WHERE status = 'finished' AND group_name LIKE 'Grupo%'
  UNION ALL
  SELECT group_name, away_team,
    1,
    CASE WHEN away_score > home_score THEN 1 ELSE 0 END,
    CASE WHEN away_score = home_score THEN 1 ELSE 0 END,
    CASE WHEN away_score < home_score THEN 1 ELSE 0 END,
    away_score, home_score
  FROM matches WHERE status = 'finished' AND group_name LIKE 'Grupo%'
)
SELECT
  t.group_name,
  t.team,
  t.flag,
  COALESCE(SUM(r.played), 0)::int AS played,
  COALESCE(SUM(r.won),    0)::int AS won,
  COALESCE(SUM(r.drawn),  0)::int AS drawn,
  COALESCE(SUM(r.lost),   0)::int AS lost,
  COALESCE(SUM(r.gf),     0)::int AS goals_for,
  COALESCE(SUM(r.ga),     0)::int AS goals_against,
  (COALESCE(SUM(r.gf), 0) - COALESCE(SUM(r.ga), 0))::int AS goal_diff,
  (COALESCE(SUM(r.won), 0) * 3 + COALESCE(SUM(r.drawn), 0))::int AS points,
  ROW_NUMBER() OVER (
    PARTITION BY t.group_name
    ORDER BY
      (COALESCE(SUM(r.won), 0) * 3 + COALESCE(SUM(r.drawn), 0)) DESC,
      (COALESCE(SUM(r.gf),  0) - COALESCE(SUM(r.ga),  0))       DESC,
      COALESCE(SUM(r.gf), 0)                                     DESC
  )::int AS position
FROM all_teams t
LEFT JOIN results r ON t.group_name = r.group_name AND t.team = r.team
GROUP BY t.group_name, t.team, t.flag
ORDER BY t.group_name, points DESC;

GRANT SELECT ON group_standings TO anon, authenticated;
