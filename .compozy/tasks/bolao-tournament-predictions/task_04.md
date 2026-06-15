---
status: completed
title: Hook useAllBonusPredictions
type: frontend
complexity: low
dependencies:
  - task_01
---

# Task 04: Hook useAllBonusPredictions

## Overview

Cria o hook `useAllBonusPredictions` que busca os palpites bônus de todos os participantes para exibição após o deadline. A RLS do banco já restringe a visibilidade (outras linhas só retornam após `2026-06-18T16:00:00Z`), então o hook simplesmente faz o SELECT e retorna os dados. Consumido pela view de leitura da página `FinalPrediction`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST seguir o padrão canônico de hooks: `useState` + inner async fn em `useEffect` + `finally { setLoading(false) }`.
- MUST fazer JOIN com `profiles` para incluir `name` e `avatar_url` de cada participante — usar `select('*, profiles(name, avatar_url)')` ou view equivalente.
- MUST retornar `{ predictions, loading, error }` onde `predictions` é array de objetos com `{ userId, userName, avatarUrl, firstPlace, secondPlace, thirdPlace, fourthPlace, bonusPoints }`.
- SHOULD ordenar os resultados por `profiles.name ASC` para display consistente.
- SHOULD não fazer fetch se `isPastDeadline` for false (evita requisição que retornaria apenas a linha do próprio usuário antes do deadline) — receber `isPastDeadline` como parâmetro ou calcular internamente via `BONUS_DEADLINE`.
</requirements>

## Subtasks

- [x] 4.1 Criar `src/hooks/useAllBonusPredictions.js` com fetch de todas as linhas joinadas com `profiles`.
- [x] 4.2 Mapear campos snake_case para camelCase no retorno.
- [x] 4.3 Escrever testes unitários mockando `supabase`.

## Implementation Details

Ver TechSpec "System Architecture" section para o papel deste hook no fluxo pós-deadline.

**Padrão a seguir:** `src/hooks/useLeaderboard.js` — faz SELECT com JOIN e retorna array de objetos mapeados.

**Query sugerida:** `supabase.from('bonus_predictions').select('*, profiles(name, avatar_url)').order('profiles(name)', { ascending: true })`

**RLS e visibilidade:** A policy `bonus_read_others_after_deadline` garante que rows de outros usuários só retornam após o deadline. O hook não precisa de lógica client-side adicional para isso — a RLS cuida.

### Relevant Files

- `src/hooks/useLeaderboard.js` — padrão de fetch com JOIN e mapeamento de campos
- `src/lib/supabase.js` — cliente Supabase
- `src/lib/bracketData.js` (task_02) — `BONUS_DEADLINE` para decidir se faz fetch

### Dependent Files

- `src/pages/FinalPrediction.jsx` (task_06) — consome este hook para a view pós-deadline

## Deliverables

- `src/hooks/useAllBonusPredictions.js`
- `src/hooks/__tests__/useAllBonusPredictions.test.jsx` com >=80% de cobertura

## Tests

- Unit tests:
  - [x] Quando `isPastDeadline` é false → não faz fetch, retorna `predictions: []`, `loading: false`
  - [x] Quando `isPastDeadline` é true → faz fetch e retorna predictions mapeadas
  - [x] Campos retornados incluem `userName` e `avatarUrl` vindos do JOIN com `profiles`
  - [x] Quando Supabase retorna erro → `error` é preenchido e `predictions` fica `[]`
  - [x] Quando não há linhas → `predictions` é array vazio
- Integration tests:
  - [x] Não se aplica (hook testado via mock do supabase client)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Hook não faz requisição ao Supabase quando `isPastDeadline` é false
- Retorno inclui dados de perfil (nome, avatar) para cada participante
