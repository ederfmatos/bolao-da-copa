-- Refinamento do trigger lock_finished_match:
-- Permite atualizar colunas de controle de notificação em partidas finalizadas,
-- bloqueando apenas alterações nos dados do jogo (placar, status, horário).
CREATE OR REPLACE FUNCTION prevent_finished_match_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'finished' THEN
    IF (
      NEW.status      IS DISTINCT FROM OLD.status      OR
      NEW.home_score  IS DISTINCT FROM OLD.home_score  OR
      NEW.away_score  IS DISTINCT FROM OLD.away_score  OR
      NEW.kickoff_at  IS DISTINCT FROM OLD.kickoff_at
    ) THEN
      RAISE EXCEPTION 'Cannot edit match % because it is already finished', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
