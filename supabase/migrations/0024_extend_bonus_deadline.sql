-- Bolão Copa 2026 - Migration 0024
-- Estende o prazo do palpite bônus de 2026-06-18T16:00:00Z para 2026-06-21T21:00:00Z,
-- alinhando-o ao prazo do artilheiro.

DROP POLICY IF EXISTS "bonus_read_others_after_deadline" ON bonus_predictions;
CREATE POLICY "bonus_read_others_after_deadline" ON bonus_predictions
  FOR SELECT USING (
    now() >= '2026-06-21T21:00:00+00'::timestamptz
  );

DROP POLICY IF EXISTS "bonus_insert_before_deadline" ON bonus_predictions;
CREATE POLICY "bonus_insert_before_deadline" ON bonus_predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    now() < '2026-06-21T21:00:00+00'::timestamptz
  );

DROP POLICY IF EXISTS "bonus_update_before_deadline" ON bonus_predictions;
CREATE POLICY "bonus_update_before_deadline" ON bonus_predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    now() < '2026-06-21T21:00:00+00'::timestamptz
  );
