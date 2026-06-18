-- Bolão Copa 2026 - Migration 0021
-- Creates scorer_players table with 30 curated World Cup top scorer candidates
-- and enables public read-only access. External API IDs (football_data_id,
-- api_sports_id) are set to NULL initially and must be filled before the
-- sync-matches function runs.
--
-- ID lookups:
--   football-data.org: GET /v4/competitions/WC/scorers -> player.id
--   api-sports.io:     GET /players/topscorers?league=1&season=2026 -> player.id

-- ============================================================================
-- SCORER PLAYERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS scorer_players (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  nationality      TEXT NOT NULL,
  flag             TEXT NOT NULL,
  position         TEXT NOT NULL CHECK (position IN ('Forward', 'Midfielder', 'Defender')),
  goals            SMALLINT NOT NULL DEFAULT 0,
  football_data_id INT,
  api_sports_id    INT
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE scorer_players ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see the player list and goal tallies (no auth needed)
DROP POLICY IF EXISTS "scorer_players_public_read" ON scorer_players;
CREATE POLICY "scorer_players_public_read" ON scorer_players
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Only the service role can modify this table via the sync-matches edge function.

-- ============================================================================
-- SEED DATA — 30 curated World Cup 2026 top scorer candidates
-- ============================================================================
INSERT INTO scorer_players (name, nationality, flag, position, goals, football_data_id, api_sports_id) VALUES
  ('Kylian Mbappé',        'França',     '🇫🇷', 'Forward',    0, NULL, NULL),
  ('Erling Haaland',        'Noruega',   '🇳🇴', 'Forward',    0, NULL, NULL),
  ('Harry Kane',            'Inglaterra','🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Forward',    0, NULL, NULL),
  ('Vinícius Júnior',      'Brasil',     '🇧🇷', 'Forward',    0, NULL, NULL),
  ('Lautaro Martínez',      'Argentina', '🇦🇷', 'Forward',    0, NULL, NULL),
  ('Julián Álvarez',        'Argentina', '🇦🇷', 'Forward',    0, NULL, NULL),
  ('Endrick',               'Brasil',     '🇧🇷', 'Forward',    0, NULL, NULL),
  ('Phil Foden',            'Inglaterra','🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Midfielder', 0, NULL, NULL),
  ('Jamal Musiala',         'Alemanha',   '🇩🇪', 'Midfielder', 0, NULL, NULL),
  ('Florian Wirtz',         'Alemanha',   '🇩🇪', 'Midfielder', 0, NULL, NULL),
  ('Kai Havertz',           'Alemanha',   '🇩🇪', 'Forward',    0, NULL, NULL),
  ('Lamine Yamal',          'Espanha',    '🇪🇸', 'Forward',    0, NULL, NULL),
  ('Pedri',                 'Espanha',    '🇪🇸', 'Midfielder', 0, NULL, NULL),
  ('Romelu Lukaku',         'Bélgica',    '🇧🇪', 'Forward',    0, NULL, NULL),
  ('Kevin De Bruyne',       'Bélgica',    '🇧🇪', 'Midfielder', 0, NULL, NULL),
  ('Memphis Depay',         'Países Baixos','🇳🇱','Forward',    0, NULL, NULL),
  ('Cody Gakpo',            'Países Baixos','🇳🇱','Forward',    0, NULL, NULL),
  ('Cristiano Ronaldo',     'Portugal',   '🇵🇹', 'Forward',    0, NULL, NULL),
  ('Rafael Leão',           'Portugal',   '🇵🇹', 'Forward',    0, NULL, NULL),
  ('Robert Lewandowski',    'Polônia',    '🇵🇱', 'Forward',    0, NULL, NULL),
  ('Darwin Núñez',          'Uruguai',    '🇺🇾', 'Forward',    0, NULL, NULL),
  ('Federico Valverde',     'Uruguai',    '🇺🇾', 'Midfielder', 0, NULL, NULL),
  ('Luis Díaz',             'Colômbia',   '🇨🇴', 'Forward',    0, NULL, NULL),
  ('Folarin Balogun',       'Estados Unidos','🇺🇸','Forward',  0, NULL, NULL),
  ('Christian Pulisic',     'Estados Unidos','🇺🇸','Midfielder',0, NULL, NULL),
  ('Santiago Giménez',      'México',     '🇲🇽', 'Forward',    0, NULL, NULL),
  ('Jonathan David',        'Canadá',     '🇨🇦', 'Forward',    0, NULL, NULL),
  ('Achraf Hakimi',         'Marrocos',   '🇲🇦', 'Defender',   0, NULL, NULL),
  ('Victor Osimhen',        'Nigéria',    '🇳🇬', 'Forward',    0, NULL, NULL),
  ('Khvicha Kvaratskhelia', 'Geórgia',    '🇬🇪', 'Forward',    0, NULL, NULL);
