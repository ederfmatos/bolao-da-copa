# Task Memory: task_02.md

## Objective Snapshot

Create useUserPredictions hook that queries user_predictions view filtered by user_id, returns { predictions, loading, error }.

## Important Decisions

- Hook follows exact same pattern as useMatchPredictions (useState/useEffect, null guard, try/catch/finally).
- Tests follow same mock pattern as useMatchPredictions (vi.hoisted builder with resolveRef).
- Removed "returns predictions ordered by created_at DESC" integration-style test checking mock data order; replaced with assertion that the hook calls .order('created_at', { ascending: false }) on the builder, since mock doesn't actually sort.

## Learnings

- Project uses `npx vitest run` for testing, `@testing-library/react` renderHook/waitFor.
- Mock pattern: vi.hoisted() with a builder mock that uses resolveRef.current for promise resolution.

## Files / Surfaces

- Created: `src/hooks/useUserPredictions.js` — hook implementation
- Created: `src/hooks/__tests__/useUserPredictions.test.jsx` — unit + integration tests (11 tests)
- Referenced: `src/hooks/useMatchPredictions.js` — pattern source

## Errors / Corrections

- Initial "returns predictions ordered by created_at DESC" test failed because mock builder.order doesn't actually sort data. Replaced with assertion that checks the order() call is made with correct params.

## Ready for Next Run

- Hook created and tested (11 tests, all passing).
- Full test suite: 207 tests passing across 17 files.
