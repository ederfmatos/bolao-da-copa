# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Update useMatches hook to fetch prediction counts per match and return predictionCounts map.

## Important Decisions

- Used queue-based mock (`resolveQueue` + `setResolutions()`) for tests because useMatches makes two sequential Supabase queries (matches + predictions), unlike the single-query useMatchPredictions hook.

## Learnings

## Files / Surfaces

- Modified: `src/hooks/useMatches.js`
- Created: `src/hooks/__tests__/useMatches.test.jsx` (9 tests)

## Errors / Corrections

## Ready for Next Run
