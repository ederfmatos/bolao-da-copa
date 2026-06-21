-- Protect finished matches and predictions from being edited after match ends
--
-- 1. Trigger on matches: prevents ANY update once status = 'finished'.
--    Applies to all callers including service_role (triggers bypass RLS bypass).
--
-- 2. Prediction policies: adds explicit status != 'finished' check alongside
--    the existing kickoff deadline, making the protection self-documenting.

-- ============================================================================
-- 1. MATCHES: block updates on finished matches
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_finished_match_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'finished' THEN
    RAISE EXCEPTION 'Cannot edit match % because it is already finished', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lock_finished_match ON matches;
CREATE TRIGGER lock_finished_match
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION prevent_finished_match_update();

-- ============================================================================
-- 2. PREDICTIONS: add explicit finished-match check to INSERT and UPDATE
--
-- The kickoff deadline (kickoff_at > now() + 15min) already blocks this
-- implicitly, but checking status = 'finished' makes the intent explicit.
-- ============================================================================

DROP POLICY IF EXISTS "predictions_insert_before_deadline" ON predictions;
DROP POLICY IF EXISTS "predictions_update_before_deadline" ON predictions;

CREATE POLICY "predictions_insert_before_deadline" ON predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.status != 'finished'
        AND m.kickoff_at > now() + INTERVAL '15 minutes'
    )
  );

CREATE POLICY "predictions_update_before_deadline" ON predictions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.status != 'finished'
        AND m.kickoff_at > now() + INTERVAL '15 minutes'
    )
  );
