---
status: completed
title: "Utilitários estáticos: bracketData.js + calculateBonusPoints.ts"
type: backend
complexity: medium
dependencies: []
---

# Task 02: Utilitários estáticos: bracketData.js + calculateBonusPoints.ts

## Overview

Cria dois utilitários puros sem dependências externas: `src/lib/bracketData.js` com os dados estáticos dos 32 times (nome, bandeira, metade do bracket) e as funções de filtragem; e `supabase/functions/_shared/calculateBonusPoints.ts` com a lógica de pontuação bônus. Ambos são fundações usadas por múltiplas tasks subsequentes.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST usar os nomes exatos em PT-BR conforme aparecem em `supabase/seed-world-cup-2026.sql` — "Países Baixos" (não "Holanda"), "Estados Unidos" (não "EUA"), "Bósnia e Herzegovina", "RD Congo", "Tchéquia", "Curaçao".
- MUST exportar `BONUS_DEADLINE = new Date('2026-06-18T16:00:00Z')` de `bracketData.js` (13:00 BRT = 16:00 UTC).
- MUST exportar `TEAMS` como array de `{ name, flag, bracketHalf }` cobrindo todos os 32 times qualificados.
- MUST exportar `getValidTeams(position, picks)` que retorna apenas times válidos para cada posição dado o que já foi selecionado — ver TechSpec "Core Interfaces" section para a assinatura completa.
- MUST exportar `deriveFourthPlace(picks)` que retorna automaticamente o 4º time com base na restrição do bracket.
- MUST implementar `calculateBonusPoints(prediction, standings)` em `_shared/calculateBonusPoints.ts` retornando: 0 corretos = 0 pts, N corretos = N×50, 4 corretos = 250 (bônus extra de 50).
- MUST tratar `standings` parcial (ex: apenas `first`/`second` definidos) — posições com `standings.third === undefined` não devem ser contadas como acerto mesmo que `prediction.third_place` seja igual a `undefined`.
- SHOULD adicionar assertion de dev (não-produção) que valida se todos os 32 nomes existem no seed — pode ser um script separado ou comentário instruindo a validação manual.
</requirements>

## Subtasks

- [x] 2.1 Ler `supabase/seed-world-cup-2026.sql` para extrair todos os nomes exatos dos times e validar as atribuições de metade do bracket com o chaveamento oficial da Copa 2026.
- [x] 2.2 Criar `src/lib/bracketData.js` com `TEAMS`, `BONUS_DEADLINE`, `getValidTeams()` e `deriveFourthPlace()`.
- [x] 2.3 Criar `supabase/functions/_shared/calculateBonusPoints.ts` seguindo o padrão de `calculatePoints.ts`.
- [x] 2.4 Escrever testes unitários para `getValidTeams()`, `deriveFourthPlace()` e `calculateBonusPoints()`.

## Implementation Details

Ver TechSpec section "Core Interfaces" para os exports completos de `bracketData.js` e a assinatura de `calculateBonusPoints`.

**Padrão a seguir:** `supabase/functions/_shared/calculatePoints.ts` — função pura exportada, sem imports, sem side effects.

**Atribuição das metades do bracket:** Basear-se no chaveamento oficial da Copa 2026. O arquivo `confrontos-impossiveis-copa2026.html` contém a análise de referência, mas os nomes devem sempre ser validados contra o seed.

**Restrição do 4º lugar:** Uma vez que 1º, 2º e 3º são escolhidos, o 4º lugar é o único time disponível na metade oposta do 3º que ainda não foi escolhido. `deriveFourthPlace` retorna `null` se qualquer um dos três anteriores estiver faltando.

### Relevant Files

- `supabase/functions/_shared/calculatePoints.ts` — padrão de função pura a replicar
- `supabase/seed-world-cup-2026.sql` — fonte de verdade para nomes dos times
- `src/lib/supabase.js` — referência de como o `src/lib/` organiza utilitários

### Dependent Files

- `src/hooks/useBonusPrediction.js` (task_03) — importa `BONUS_DEADLINE` e `getValidTeams`
- `src/components/TeamPicker.jsx` (task_05) — importa `TEAMS` para renderizar a lista
- `src/pages/Matches.jsx` (task_07) — importa `BONUS_DEADLINE` para o banner
- `supabase/functions/sync-matches/index.ts` (task_08) — importa `calculateBonusPoints`

### Related ADRs

- [ADR-002: Hard-Coded Bracket Metadata in src/lib/bracketData.js](adrs/adr-002.md) — justifica por que esses dados são estáticos e não ficam em uma tabela do banco

## Deliverables

- `src/lib/bracketData.js` com todos os 32 times, helpers e deadline
- `supabase/functions/_shared/calculateBonusPoints.ts`
- Testes unitários para ambos com >=80% de cobertura

## Tests

- Unit tests:
  - [x] `calculateBonusPoints`: 0 acertos → 0 pts
  - [x] `calculateBonusPoints`: apenas campeão correto → 50 pts
  - [x] `calculateBonusPoints`: 2 acertos quaisquer → 100 pts
  - [x] `calculateBonusPoints`: 3 acertos → 150 pts
  - [x] `calculateBonusPoints`: todos 4 corretos → 250 pts (bônus extra)
  - [x] `calculateBonusPoints`: standings parcial com apenas `first`/`second` definidos e prediction com 3º correto → não conta 3º
  - [x] `getValidTeams('first', {})` → retorna todos os 48 times
  - [x] `getValidTeams('second', { first: 'Brasil' })` → retorna apenas times da metade RIGHT (Brasil é LEFT)
  - [x] `getValidTeams('second', { first: 'Espanha' })` → retorna apenas times da metade LEFT (Espanha é RIGHT)
  - [x] `getValidTeams('second', { first: 'Brasil' })` → não contém 'Brasil'
  - [x] `getValidTeams('third', { first: 'Brasil', second: 'Espanha' })` → não contém 'Brasil' nem 'Espanha'
  - [x] `deriveFourthPlace({ first: 'Brasil', second: 'Espanha', third: 'Argentina' })` → retorna time da metade RIGHT diferente de Espanha
  - [x] `deriveFourthPlace({ first: 'Brasil', second: 'Espanha' })` → retorna null (3º ausente)
- Integration tests:
  - [x] Não se aplica (utilitários puros sem I/O)
- Test coverage target: >=80% ✓ (100% lines, 100% statements, 100% functions, 92.59% branches)
- All tests must pass ✓

## Success Criteria

- All tests passing
- Test coverage >=80%
- Todos os 32 nomes de times em `TEAMS` correspondem exatamente aos nomes em `seed-world-cup-2026.sql`
- `deriveFourthPlace` retorna null quando qualquer pick anterior está ausente
- `calculateBonusPoints` retorna 250 apenas quando todos os 4 acertos são confirmados
