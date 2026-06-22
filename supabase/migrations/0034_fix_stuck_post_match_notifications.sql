-- Marca como notificados todos os jogos finalizados que ainda estão com
-- post_match_notified_at = NULL, parando o loop de reenvio duplicado.
-- O trigger lock_finished_match precisa ser desabilitado temporariamente
-- pois bloqueia qualquer UPDATE em partidas finalizadas.
ALTER TABLE matches DISABLE TRIGGER lock_finished_match;

UPDATE matches
SET post_match_notified_at = NOW()
WHERE status = 'finished'
  AND post_match_notified_at IS NULL;

ALTER TABLE matches ENABLE TRIGGER lock_finished_match;
