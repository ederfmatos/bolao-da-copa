-- Bolão Copa 2026 - Social Features RLS Migration
-- Updates RLS policies to allow all authenticated users to read
-- predictions and profiles, and creates a match_predictions view.

-- ============================================================================
-- PROFILES RLS: allow all authenticated users to read
-- ============================================================================
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- PREDICTIONS RLS: allow all authenticated users to read
-- ============================================================================
DROP POLICY IF EXISTS "predictions_read_own" ON predictions;

DROP POLICY IF EXISTS "predictions_read_all" ON predictions;
CREATE POLICY "predictions_read_all" ON predictions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- MATCH PREDICTIONS VIEW: predictions with user profile data
-- ============================================================================
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
JOIN profiles p ON p.id = pr.user_id;
