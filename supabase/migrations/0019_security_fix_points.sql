-- Security fix: prevent authenticated users from writing to points/bonus_points
--
-- Root causes fixed:
--   1. Column-level privileges: 'authenticated' role could UPDATE any column,
--      including 'points' and 'bonus_points', allowing score manipulation.
--   2. RLS OR-logic bug: two separate permissive INSERT/UPDATE policies were
--      combined with OR by PostgreSQL, making the deadline check useless.
--   3. Defense-in-depth trigger: resets points to OLD value if the caller is
--      an authenticated frontend user, even if other layers are bypassed.
--
-- The 'service_role' (used by Edge Functions) retains full access because
-- it holds a table-level ALL PRIVILEGES grant that supersedes column-level
-- restrictions on 'authenticated'.

-- ============================================================================
-- 1. COLUMN-LEVEL PRIVILEGES: predictions
-- ============================================================================

REVOKE INSERT ON predictions FROM authenticated;
REVOKE UPDATE ON predictions FROM authenticated;

-- Users may only write score fields; 'points' is server-only
GRANT INSERT (user_id, match_id, home_score, away_score) ON predictions TO authenticated;
GRANT UPDATE (user_id, match_id, home_score, away_score, updated_at) ON predictions TO authenticated;

-- ============================================================================
-- 2. COLUMN-LEVEL PRIVILEGES: bonus_predictions
-- ============================================================================

REVOKE INSERT ON bonus_predictions FROM authenticated;
REVOKE UPDATE ON bonus_predictions FROM authenticated;

-- Users may only write placement fields; 'bonus_points' is server-only
GRANT INSERT (user_id, first_place, second_place, third_place, fourth_place) ON bonus_predictions TO authenticated;
GRANT UPDATE (user_id, first_place, second_place, third_place, fourth_place, updated_at) ON bonus_predictions TO authenticated;

-- ============================================================================
-- 3. FIX RLS OR-LOGIC BUG: predictions INSERT
--
-- PostgreSQL combines multiple permissive policies with OR. Having a separate
-- ownership policy and a separate deadline policy meant the deadline was never
-- enforced (ownership alone was enough to pass). Merged into a single policy.
-- ============================================================================

DROP POLICY IF EXISTS "predictions_insert_own" ON predictions;
DROP POLICY IF EXISTS "predictions_before_deadline_insert" ON predictions;

CREATE POLICY "predictions_insert_before_deadline" ON predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now() + INTERVAL '15 minutes'
    )
  );

-- ============================================================================
-- 4. FIX RLS OR-LOGIC BUG: predictions UPDATE
-- ============================================================================

DROP POLICY IF EXISTS "predictions_update_own" ON predictions;
DROP POLICY IF EXISTS "predictions_before_deadline_update" ON predictions;

CREATE POLICY "predictions_update_before_deadline" ON predictions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now() + INTERVAL '15 minutes'
    )
  );

-- ============================================================================
-- 5. DEFENSE-IN-DEPTH: trigger to reset points if called by authenticated user
--
-- auth.role() reads the JWT claims set by PostgREST per request:
--   - Frontend user JWT  → 'authenticated'  → points reset to OLD value
--   - Service role JWT   → 'service_role'   → no-op, Edge Functions unaffected
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.points = OLD.points;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS lock_prediction_points ON predictions;
CREATE TRIGGER lock_prediction_points
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION protect_prediction_points();

CREATE OR REPLACE FUNCTION protect_bonus_points()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.bonus_points = OLD.bonus_points;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS lock_bonus_points ON bonus_predictions;
CREATE TRIGGER lock_bonus_points
  BEFORE UPDATE ON bonus_predictions
  FOR EACH ROW EXECUTE FUNCTION protect_bonus_points();
