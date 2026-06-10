---
status: completed
title: Points assignment após resultado
type: backend
complexity: medium
dependencies: [task_07, task_08]
---

## Overview

Extend the `sync-matches` Edge Function to calculate and assign points to all predictions whenever a match transitions to `status = 'finished'`. Uses the `calculatePoints` utility from task_08.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "API & Integration Design — Edge Function: sync-matches" step 3.
- Focus on correctness of point assignment — every prediction for a finished match must be updated exactly once.
- Use bulk updates to minimize DB round trips.
- Tests are required.
</critical>

<requirements>
1. MUST extend `sync-matches/index.ts` to call `calculatePoints` for each prediction on newly-finished matches.
2. MUST bulk-update `predictions.points` for all affected predictions in a single operation where possible.
3. MUST NOT recalculate points for matches already processed (status was already `'finished'` in previous sync cycle).
4. MUST use the actual `home_score` and `away_score` from the `matches` table as the ground truth.
5. MUST handle the case where a match has zero predictions gracefully (no error, just skip).
6. SHOULD log the number of predictions updated per match.
</requirements>

## Subtasks

- [ ] Import `calculatePoints` from `_shared/calculatePoints.ts` inside `sync-matches/index.ts`.
- [ ] After upsert, iterate over newly-finished match IDs (detected in task_07).
- [ ] For each newly-finished match, fetch all predictions and calculate points.
- [ ] Bulk-update `predictions.points` for all affected rows.
- [ ] Write unit tests for the points assignment logic.

## Implementation Details

Files to modify:
- `supabase/functions/sync-matches/index.ts` — add points assignment step after upsert.

Files used:
- `supabase/functions/_shared/calculatePoints.ts` (task_08).

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` — `predictions` table schema (task_01).
- `supabase/functions/sync-matches/index.ts` — already handles upsert and finished-match detection (task_07).

### Dependent Files
- `src/hooks/useLeaderboard.js` — reads `predictions.points` to compute rankings (task_12).

### Related ADRs
- None.

## Deliverables

- Points correctly assigned to all predictions after a match result.
- Already-processed matches not recalculated.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] Points assignment called only for matches in the newly-finished list, not all finished matches.
- [ ] `calculatePoints` result correctly written to `predictions.points` for each prediction.
- [ ] Match with 0 predictions: no error, no DB update attempted.
- [ ] Match with multiple predictions: all rows updated in the same sync run.
- [ ] Already-finished match (from previous sync): points not recalculated or overwritten.

### Integration Tests
- [ ] After manually triggering sync with a mocked finished match, all predictions for that match have correct `points` values in DB.
- [ ] `leaderboard` view reflects updated points immediately after assignment.

## Success Criteria

- Points assigned correctly for all five scoring scenarios.
- No double-processing of already-finished matches.
- Leaderboard view reflects correct points after sync.
- Test coverage >= 80%.
