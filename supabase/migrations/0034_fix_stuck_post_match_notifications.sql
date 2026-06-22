-- Marca como notificados todos os jogos finalizados que ainda estão com
-- post_match_notified_at = NULL, parando o loop de reenvio duplicado.
UPDATE matches
SET post_match_notified_at = NOW()
WHERE status = 'finished'
  AND post_match_notified_at IS NULL;
