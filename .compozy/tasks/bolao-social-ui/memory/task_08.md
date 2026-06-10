# Task Memory: task_08.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Create MatchDetails page showing match info, user's editable prediction, and social predictions list.

## Important Decisions

- Created PredictionRow inline within this task since task_09 depends on task_08 but MatchDetails needs PredictionRow to render the social list.
- Used match.status + kickoff_at time comparison for editability logic, consistent with existing Predict.jsx patterns.

## Learnings

- The builder mock pattern for supabase queries needs `.single()` in the chain (in addition to `.select()`, `.eq()`, `.order()`). Hook tests didn't need this since they only do `.select().eq().order().then()`, but page-level `.single()` queries require it.
- When both match loading and social loading can be independent states, tests must distinguish between the two loading states by awaiting match resolution first.

## Files / Surfaces

- `src/pages/MatchDetails.jsx` — new page implementation
- `src/components/PredictionRow.jsx` — new component (dependency for social list)
- `src/App.jsx` — replaced Predict import/route with MatchDetails
- `src/pages/__tests__/MatchDetails.test.jsx` — 20 tests covering all states
- `src/__tests__/App.test.jsx` — updated mock and route test

## Errors / Corrections

- Fixed: `getByAltText('')` errors when multiple flag images share the same empty alt — use `getAllByAltText('').toHaveLength(2)`.
- Fixed: social loading test failed because match loading state ("Carregando...") takes priority before match resolves — use `waitFor` to await match data first.

## Ready for Next Run

All 77 tests pass. Task complete.
