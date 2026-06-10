---
status: pending
title: Points calculation utility
type: backend
complexity: low
dependencies: []
---

## Overview

Implement the pure `calculatePoints` utility function that determines how many points a participant earns for a given prediction vs. actual result. This function has no dependencies and can be implemented and tested in isolation.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Core Interfaces — Points Calculation" for the exact function signature and scoring rules.
- This is a pure function — no DB access, no side effects.
- Cover all five scoring scenarios with tests.
- Tests are required.
</critical>

<requirements>
1. MUST implement `calculatePoints(predicted, actual)` exactly as specified in TechSpec "Core Interfaces".
2. MUST return 10 for an exact score match.
3. MUST return 7 for correct winner + correct goal difference (non-exact score).
4. MUST return 7 for a correct draw prediction (wrong score).
5. MUST return 3 for correct winner only (wrong goal difference).
6. MUST return 0 for all other cases (wrong winner or wrong draw prediction).
7. MUST be usable from both Edge Functions (Deno) and potentially frontend (for preview purposes).
8. SHOULD be placed in a shared location importable by `sync-matches` and any future functions.
</requirements>

## Subtasks

- [ ] Create `supabase/functions/_shared/calculatePoints.ts` with the pure function.
- [ ] Implement all five scoring branches per TechSpec scoring rules.
- [ ] Write exhaustive unit tests covering all branches and edge cases.

## Implementation Details

Files to create:
- `supabase/functions/_shared/calculatePoints.ts`

Reference TechSpec "Core Interfaces — Points Calculation" for the full implementation including the `Math.sign` pattern for winner detection.

### Relevant Files
- None — this is a standalone pure function.

### Dependent Files
- `supabase/functions/sync-matches/index.ts` — task_11 will import this to assign points after match results.

### Related ADRs
- None.

## Deliverables

- `calculatePoints.ts` with all five scoring branches.
- 100% test coverage (pure function — all branches testable).

## Tests

### Unit Tests
- [ ] Exact score: predicted 2×1, actual 2×1 → 10 pts.
- [ ] Exact score draw: predicted 1×1, actual 1×1 → 10 pts.
- [ ] Correct winner + correct diff: predicted 2×0, actual 3×1 (both +2) → 7 pts.
- [ ] Correct draw wrong score: predicted 1×1, actual 2×2 → 7 pts.
- [ ] Correct winner only (diff wrong): predicted 1×0, actual 3×1 → 3 pts.
- [ ] Wrong winner: predicted 2×0, actual 0×1 → 0 pts.
- [ ] Predicted draw but match had a winner: predicted 1×1, actual 2×1 → 0 pts.
- [ ] Predicted winner but match was a draw: predicted 2×0, actual 1×1 → 0 pts.
- [ ] Scores of 0×0: predicted 0×0, actual 0×0 → 10 pts.

### Integration Tests
- N/A — pure function, unit tests are sufficient.

## Success Criteria

- All 9 unit test cases pass.
- Test coverage = 100%.
- Function is importable from Edge Function context (Deno).
