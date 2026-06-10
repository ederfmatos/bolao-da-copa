-- Bolão Copa 2026 - Initial Schema Migration
-- Creates: profiles, matches, predictions tables, leaderboard view, RLS policies, and auto-profile trigger

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id           TEXT PRIMARY KEY,
  home_team    TEXT NOT NULL,
  away_team    TEXT NOT NULL,
  home_flag    TEXT,
  away_flag    TEXT,
  group_name   TEXT,
  kickoff_at   TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score   SMALLINT CHECK (home_score >= 0),
  away_score   SMALLINT CHECK (away_score >= 0),
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches (kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);

-- ============================================================================
-- PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id    TEXT NOT NULL REFERENCES matches(id),
  home_score  SMALLINT NOT NULL CHECK (home_score >= 0),
  away_score  SMALLINT NOT NULL CHECK (away_score >= 0),
  points      SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions (match_id);

-- ============================================================================
-- LEADERBOARD VIEW
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COUNT(pr.id) AS total_predictions
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY total_points DESC;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Matches policies (all authenticated users can read)
DROP POLICY IF EXISTS "matches_read_all" ON matches;
CREATE POLICY "matches_read_all" ON matches
  FOR SELECT USING (auth.role() = 'authenticated');

-- Predictions policies
DROP POLICY IF EXISTS "predictions_read_own" ON predictions;
CREATE POLICY "predictions_read_own" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictions_insert_own" ON predictions;
CREATE POLICY "predictions_insert_own" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictions_update_own" ON predictions;
CREATE POLICY "predictions_update_own" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Deadline enforcement: predictions can only be inserted/updated 1+ hour before kickoff
DROP POLICY IF EXISTS "predictions_before_deadline_insert" ON predictions;
CREATE POLICY "predictions_before_deadline_insert" ON predictions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now() + INTERVAL '1 hour'
    )
  );

DROP POLICY IF EXISTS "predictions_before_deadline_update" ON predictions;
CREATE POLICY "predictions_before_deadline_update" ON predictions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now() + INTERVAL '1 hour'
    )
  );

-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- REALTIME (enable publication for predictions table)
-- ============================================================================
-- Note: Realtime must also be enabled via Supabase Dashboard > Database > Replication
