# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Created `src/hooks/useMatchPredictions.js` hook.
- Created `src/hooks/__tests__/useMatchPredictions.test.jsx` with 10 tests.

## Important Decisions

- Followed TechSpec implementation exactly (early return on !matchId, `.order()` chain for sorting).
- Used `vi.hoisted()` for mock setup to avoid vitest hoisting/TDZ issues with `vi.mock` factory.
- Mock path in test must be `../../lib/supabase` (relative from `src/hooks/__tests__/` to `src/lib/supabase`).

## Learnings

- `vi.mock` paths are resolved relative to the test file, NOT the source file. The import `../lib/supabase` in the hook at `src/hooks/` resolves to `src/lib/supabase`, but `vi.mock('../lib/supabase')` from `src/hooks/__tests__/` would resolve to `src/hooks/lib/supabase`. Use `../../lib/supabase` from `src/hooks/__tests__/` to reach `src/lib/supabase`.

## Files / Surfaces

- Created: `src/hooks/useMatchPredictions.js`
- Created: `src/hooks/__tests__/useMatchPredictions.test.jsx`

## Errors / Corrections

- Initial test file had wrong `vi.mock` path (`../lib/supabase` instead of `../../lib/supabase`). Fixed in first iteration.

## Ready for Next Run
