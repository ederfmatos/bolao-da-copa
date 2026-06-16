-- Remove updated_at from UPDATE grant (was included unnecessarily in 0019,
-- leaving a vector to fake modification timestamps) and add a trigger to
-- maintain it automatically so the application never needs to send it.

-- ============================================================================
-- PREDICTIONS
-- ============================================================================

REVOKE UPDATE ON predictions FROM authenticated;
GRANT UPDATE (user_id, match_id, home_score, away_score) ON predictions TO authenticated;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS predictions_set_updated_at ON predictions;
CREATE TRIGGER predictions_set_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- BONUS_PREDICTIONS
-- ============================================================================

REVOKE UPDATE ON bonus_predictions FROM authenticated;
GRANT UPDATE (user_id, first_place, second_place, third_place, fourth_place) ON bonus_predictions TO authenticated;

DROP TRIGGER IF EXISTS bonus_predictions_set_updated_at ON bonus_predictions;
CREATE TRIGGER bonus_predictions_set_updated_at
  BEFORE UPDATE ON bonus_predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
