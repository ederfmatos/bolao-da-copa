-- Bolão Copa 2026 - Migration 0041
-- Corrige winner_team de Países Baixos x Marrocos: Marrocos ganhou nos pênaltis.
-- Recalcula bracket_points para o slot R32_04.

UPDATE matches
SET winner_team = 'Marrocos'
WHERE bracket_slot = 'R32_04'
  AND status = 'finished';

-- Recalcula bracket_points para R32_04 (5 pts se acertou Marrocos, 0 se não)
UPDATE bracket_predictions bp
SET bracket_points = CASE
  WHEN bp.predicted_winner = 'Marrocos' THEN 5
  ELSE 0
END
WHERE bp.bracket_slot = 'R32_04';
