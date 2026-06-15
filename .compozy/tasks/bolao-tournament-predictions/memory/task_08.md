# Task Memory: task_08.md

## Objective Snapshot

Extend sync-matches edge function to detect when Final/Terceiro Lugar matches finish, derive standings, and recalculate bonus_points across all bonus_predictions rows.

## Important Decisions

- Exported `recalculateBonusPoints` function for direct unit testing (standard testability practice)
- Used seedMatches cross-reference for trigger detection (checking group_name from in-memory data) instead of changing newlyFinished/scoreUpdated types
- Created separate test file `__tests__/recalculateBonusPoints.test.ts` because the existing `index.test.ts` has stale pre-existing mocks incompatible with the current code

## Learnings

- The existing `index.test.ts` mocks `fetchWithFallback` from a `providers/index` module that no longer exists in the actual code — all 13 existing handler tests are stale
- `mockFrom` chain for `select('*')` must return `Promise.resolve({ data, error })` directly (no chaining), while `select('specific_cols')` must return a chainable object with `.eq()` and `.in()`
- `FOOTBALL_DATA_API_KEY` env var was missing from existing test beforeEach, causing handler to throw early

## Files / Surfaces

- `supabase/functions/sync-matches/index.ts` — added import for `calculateBonusPoints`, `recalculateBonusPoints` function, trigger condition
- `supabase/functions/sync-matches/__tests__/recalculateBonusPoints.test.ts` — new file with 10 direct unit tests
- `supabase/functions/sync-matches/__tests__/index.test.ts` — added mock for `calculateBonusPoints`, 5 handler-level trigger tests, fixed env vars and fetch mock

## Errors / Corrections

- Initial test run failed because `FOOTBALL_DATA_API_KEY` was not in test env vars — fixed by adding to beforeEach
- "NOT triggered when no matches finish" test failed because matches mock was missing `update()` method — added it

## Ready for Next Run

Task complete. All 15 new tests pass (10 direct + 5 handler-level). Proceed to tracking update and commit.
