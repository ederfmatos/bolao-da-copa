---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/hooks/useMatches.js
line: 20
severity: medium
author: opencode
provider_ref:
---

# Issue 004: useMatches faz duas queries separadas impactando performance

## Review Comment

O hook `useMatches.js` faz duas queries separadas ao Supabase:
```jsx
const { data: matchesData, error: matchesError } = await supabase
  .from('matches')
  .select('*')
  .order('kickoff_at', { ascending: true })

const { data: countsData, error: countsError } = await supabase
  .from('predictions')
  .select('match_id')
```

**Problemas**:
1. Duas requisições HTTP em vez de uma
2. A segunda query traz todas as predictions apenas para contar, o que pode ser pesado com muitos usuários
3. Não há tratamento de erro para a segunda query - se falhar, `predictionCounts` fica vazio silenciosamente

**Sugestão de correção**:
1. Criar uma view no banco que já traga a contagem:
```sql
CREATE VIEW matches_with_counts AS
SELECT m.*, COUNT(p.id) as prediction_count
FROM matches m
LEFT JOIN predictions p ON p.match_id = m.id
GROUP BY m.id;
```

2. Ou usar uma query com join e aggregate:
```jsx
const { data } = await supabase
  .from('matches')
  .select('*, predictions(count)')
```

3. Adicionar tratamento de erro explícito para a segunda query

**Impacto**: Performance degradada em cenários com muitos usuários e partidas.

## Triage

- Decision: `VALID`
- Root cause: `useMatches` performs two sequential `supabase.from().select()` calls — one for matches, another for predictions — doubling HTTP round trips and fetching all prediction rows just to count per match.
- Fix approach: Replace with a single Supabase query using the foreign-key relationship: `supabase.from('matches').select('*, predictions(count)')`. Supabase/PostgREST aggregates prediction counts server-side via a LEFT JOIN + COUNT, returning `predictions: [{count: N}]` on each match row. Parse counts client-side from that field. Strip the synthetic `predictions` field from match objects before returning to consumers to keep the public API unchanged.
- Error handling: The second query previously had partial error handling (checked `countsError` without throwing). The single query uses a unified `if (error) throw error` pattern, so both the matches data and counts fail atomically.
- Impact: medium — reduces N+1 queries, lowers bandwidth (no full prediction rows), and adds atomic error handling.
