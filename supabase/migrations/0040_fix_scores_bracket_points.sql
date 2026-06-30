-- Bolão Copa 2026 - Migration 0040
-- 1. Adiciona coluna winner_team para vencedor em partidas decididas nos pênaltis
-- 2. Corrige placares de Alemanha x Paraguai e Países Baixos x Marrocos (1x1, não pênaltis)
-- 3. Recalcula pontos das predictions para essas partidas
-- 4. Recalcula bracket_points para todos os slots de mata-mata já finalizados

-- ============================================================================
-- 1. ADICIONA COLUNA winner_team
-- ============================================================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_team TEXT;

-- ============================================================================
-- 2. SALVA O VENCEDOR COM BASE NO PLACAR ATUAL (pênaltis) ANTES DE CORRIGIR
-- ============================================================================
-- Desabilita o trigger lock_finished_match para poder corrigir home_score/away_score
ALTER TABLE matches DISABLE TRIGGER lock_finished_match;

UPDATE matches
SET winner_team = CASE WHEN home_score > away_score THEN home_team ELSE away_team END
WHERE status = 'finished'
  AND home_score IS NOT NULL
  AND away_score IS NOT NULL
  AND home_score = away_score IS FALSE  -- só para resultados não empatados (i.e., placar de pênaltis já gravado errado)
  AND (
    (home_team ILIKE '%Alemanha%'     AND away_team ILIKE '%Paraguai%')
    OR (home_team ILIKE '%Paraguai%'  AND away_team ILIKE '%Alemanha%')
    OR (home_team ILIKE '%Países Baixos%' AND away_team ILIKE '%Marrocos%')
    OR (home_team ILIKE '%Marrocos%'  AND away_team ILIKE '%Países Baixos%')
  );

-- ============================================================================
-- 3. CORRIGE OS PLACARES PARA O PLACAR DO TEMPO REGULAMENTAR (1x1)
-- ============================================================================
UPDATE matches
SET home_score = 1, away_score = 1
WHERE status = 'finished'
  AND (
    (home_team ILIKE '%Alemanha%'     AND away_team ILIKE '%Paraguai%')
    OR (home_team ILIKE '%Paraguai%'  AND away_team ILIKE '%Alemanha%')
    OR (home_team ILIKE '%Países Baixos%' AND away_team ILIKE '%Marrocos%')
    OR (home_team ILIKE '%Marrocos%'  AND away_team ILIKE '%Países Baixos%')
  );

-- Reabilita o trigger de proteção
ALTER TABLE matches ENABLE TRIGGER lock_finished_match;

-- ============================================================================
-- 4. RECALCULA PONTOS DAS PREDICTIONS PARA AS PARTIDAS CORRIGIDAS
--    calculatePoints para resultado real 1x1:
--      • Placar exato 1x1           → 10 pts
--      • Qualquer outro empate      → 5 pts
--      • Não empate                 → 0 pts
-- ============================================================================
WITH target_matches AS (
  SELECT id
  FROM matches
  WHERE status = 'finished'
    AND (
      (home_team ILIKE '%Alemanha%'     AND away_team ILIKE '%Paraguai%')
      OR (home_team ILIKE '%Paraguai%'  AND away_team ILIKE '%Alemanha%')
      OR (home_team ILIKE '%Países Baixos%' AND away_team ILIKE '%Marrocos%')
      OR (home_team ILIKE '%Marrocos%'  AND away_team ILIKE '%Países Baixos%')
    )
)
UPDATE predictions pr
SET points = CASE
  WHEN pr.home_score = 1 AND pr.away_score = 1                THEN 10
  WHEN (pr.home_score - pr.away_score) = 0                    THEN 5
  ELSE 0
END
WHERE pr.match_id IN (SELECT id FROM target_matches);

-- ============================================================================
-- 5. RECALCULA bracket_points PARA TODOS OS SLOTS DE MATA-MATA FINALIZADOS
--    Replica a lógica de calculateBracketPoints() em PL/pgSQL.
-- ============================================================================
DO $$
DECLARE
  v_rec            RECORD;
  v_bracket_slot   TEXT;
  v_actual_winner  TEXT;
  v_actual_opponent TEXT;
  v_full_pts       SMALLINT;
  v_partial_pts    SMALLINT;
  v_parent1        TEXT;
  v_parent2        TEXT;
  v_pred           RECORD;
  v_p1_winner      TEXT;
  v_p2_winner      TEXT;
  v_user_opponent  TEXT;
  v_pts            SMALLINT;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT ON (bracket_slot)
      bracket_slot, home_team, away_team, home_score, away_score, winner_team
    FROM matches
    WHERE bracket_slot IS NOT NULL
      AND status = 'finished'
      AND home_score IS NOT NULL
      AND away_score IS NOT NULL
    ORDER BY bracket_slot
  LOOP
    v_bracket_slot := v_rec.bracket_slot;

    -- Determina vencedor real (usa winner_team para pênaltis, senão placar)
    IF v_rec.winner_team IS NOT NULL AND v_rec.winner_team <> '' THEN
      v_actual_winner  := v_rec.winner_team;
      v_actual_opponent := CASE
        WHEN v_rec.winner_team = v_rec.home_team THEN v_rec.away_team
        ELSE v_rec.home_team
      END;
    ELSIF v_rec.home_score > v_rec.away_score THEN
      v_actual_winner   := v_rec.home_team;
      v_actual_opponent := v_rec.away_team;
    ELSE
      v_actual_winner   := v_rec.away_team;
      v_actual_opponent := v_rec.home_team;
    END IF;

    -- Pontos e parents por fase
    CASE v_bracket_slot
      WHEN 'R32_01' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_02' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_03' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_04' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_05' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_06' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_07' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_08' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_09' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_10' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_11' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_12' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_13' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_14' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_15' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R32_16' THEN v_full_pts := 5;  v_partial_pts := 5;  v_parent1 := NULL;    v_parent2 := NULL;
      WHEN 'R16_01' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_01'; v_parent2 := 'R32_02';
      WHEN 'R16_02' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_03'; v_parent2 := 'R32_04';
      WHEN 'R16_03' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_05'; v_parent2 := 'R32_06';
      WHEN 'R16_04' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_07'; v_parent2 := 'R32_08';
      WHEN 'R16_05' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_09'; v_parent2 := 'R32_10';
      WHEN 'R16_06' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_11'; v_parent2 := 'R32_12';
      WHEN 'R16_07' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_13'; v_parent2 := 'R32_14';
      WHEN 'R16_08' THEN v_full_pts := 10; v_partial_pts := 5;  v_parent1 := 'R32_15'; v_parent2 := 'R32_16';
      WHEN 'QF_01'  THEN v_full_pts := 15; v_partial_pts := 10; v_parent1 := 'R16_01'; v_parent2 := 'R16_02';
      WHEN 'QF_02'  THEN v_full_pts := 15; v_partial_pts := 10; v_parent1 := 'R16_03'; v_parent2 := 'R16_04';
      WHEN 'QF_03'  THEN v_full_pts := 15; v_partial_pts := 10; v_parent1 := 'R16_05'; v_parent2 := 'R16_06';
      WHEN 'QF_04'  THEN v_full_pts := 15; v_partial_pts := 10; v_parent1 := 'R16_07'; v_parent2 := 'R16_08';
      WHEN 'SF_01'  THEN v_full_pts := 20; v_partial_pts := 15; v_parent1 := 'QF_01';  v_parent2 := 'QF_02';
      WHEN 'SF_02'  THEN v_full_pts := 20; v_partial_pts := 15; v_parent1 := 'QF_03';  v_parent2 := 'QF_04';
      WHEN 'FINAL'  THEN v_full_pts := 25; v_partial_pts := 20; v_parent1 := 'SF_01';  v_parent2 := 'SF_02';
      WHEN '3RD'    THEN v_full_pts := 25; v_partial_pts := 20; v_parent1 := 'SF_01';  v_parent2 := 'SF_02';
      ELSE CONTINUE;
    END CASE;

    FOR v_pred IN
      SELECT id, user_id, predicted_winner
      FROM bracket_predictions
      WHERE bracket_slot = v_bracket_slot
    LOOP
      -- Vencedor errado: 0 pontos
      IF v_pred.predicted_winner <> v_actual_winner THEN
        UPDATE bracket_predictions SET bracket_points = 0 WHERE id = v_pred.id;
        CONTINUE;
      END IF;

      -- Sem parents (R32): sempre full points
      IF v_parent1 IS NULL THEN
        UPDATE bracket_predictions SET bracket_points = v_full_pts WHERE id = v_pred.id;
        CONTINUE;
      END IF;

      -- Busca predições dos slots pai do usuário
      SELECT predicted_winner INTO v_p1_winner
      FROM bracket_predictions
      WHERE user_id = v_pred.user_id AND bracket_slot = v_parent1;

      SELECT predicted_winner INTO v_p2_winner
      FROM bracket_predictions
      WHERE user_id = v_pred.user_id AND bracket_slot = v_parent2;

      -- Deriva o oponente predito pelo usuário
      IF v_pred.predicted_winner = v_p1_winner THEN
        v_user_opponent := v_p2_winner;
      ELSIF v_pred.predicted_winner = v_p2_winner THEN
        v_user_opponent := v_p1_winner;
      ELSE
        v_user_opponent := COALESCE(v_p1_winner, v_p2_winner, '');
      END IF;

      -- Calcula pontos
      IF COALESCE(v_user_opponent, '') = v_actual_opponent THEN
        v_pts := v_full_pts;
      ELSE
        v_pts := v_partial_pts;
      END IF;

      UPDATE bracket_predictions SET bracket_points = v_pts WHERE id = v_pred.id;
    END LOOP;
  END LOOP;
END $$;
