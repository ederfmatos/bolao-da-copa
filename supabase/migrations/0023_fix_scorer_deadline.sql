-- Bolão Copa 2026 - Migration 0023
-- Fixes scorer_predictions RLS deadline from 2026-06-12 to 2026-06-21T21:00:00Z
-- to match SCORER_DEADLINE in src/lib/bracketData.js

DROP POLICY IF EXISTS "scorer_read_others_after_deadline" ON scorer_predictions;
CREATE POLICY "scorer_read_others_after_deadline" ON scorer_predictions
  FOR SELECT USING (
    now() >= '2026-06-21T21:00:00+00'::timestamptz
  );

DROP POLICY IF EXISTS "scorer_insert_before_deadline" ON scorer_predictions;
CREATE POLICY "scorer_insert_before_deadline" ON scorer_predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    now() < '2026-06-21T21:00:00+00'::timestamptz
  );

DROP POLICY IF EXISTS "scorer_update_before_deadline" ON scorer_predictions;
CREATE POLICY "scorer_update_before_deadline" ON scorer_predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    now() < '2026-06-21T21:00:00+00'::timestamptz
  );
