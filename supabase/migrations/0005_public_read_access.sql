-- Allow public read access to matches
DROP POLICY IF EXISTS "matches_read_all" ON matches;
CREATE POLICY "matches_read_public" ON matches
  FOR SELECT USING (true);

-- Allow public read access to predictions
DROP POLICY IF EXISTS "predictions_read_all" ON predictions;
CREATE POLICY "predictions_read_public" ON predictions
  FOR SELECT USING (true);

-- Allow public read access to profiles
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_public" ON profiles
  FOR SELECT USING (true);
