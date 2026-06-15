# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Create `useAllBonusPredictions` hook that fetches all bonus predictions with profile JOIN after deadline.

## Important Decisions

- `isPastDeadline` calculated internally via `BONUS_DEADLINE` (same pattern as `useBonusPrediction`), no parameter
- Effect deps: `[]` — `isPastDeadline` is effectively constant, captured via closure
- Mapped return shape: `{ userId, userName, avatarUrl, firstPlace, secondPlace, thirdPlace, fourthPlace, bonusPoints }`
- Query: `supabase.from('bonus_predictions').select('*, profiles(name, avatar_url)').order('profiles(name)', { ascending: true })`
- Hook pattern follows `useLeaderboard.js` — fetch-all with JOIN, no realtime subscription needed

## Learnings

- `vi.useFakeTimers()` freezes timers including `waitFor` polling; need `shouldAdvanceTime: true` for async tests with `waitFor`
- The builder pattern for Supabase mock (`.mockReturnThis()` chain + `.then()` for await) is the established pattern in this codebase

## Files / Surfaces

- src/hooks/useAllBonusPredictions.js (new)
- src/hooks/__tests__/useAllBonusPredictions.test.jsx (new)

## Errors / Corrections

## Ready for Next Run

- Task 06 (FinalPrediction page) consumes this hook — verify import path and return shape match expectations
- Uncovered branch at line 30: `row.profiles?.name ?? null` — defensive code, no action needed (JOIN always resolves via FK)
