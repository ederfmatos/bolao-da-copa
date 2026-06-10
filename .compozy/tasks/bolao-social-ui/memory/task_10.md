# Task Memory: task_10.md

## Objective Snapshot

Migrate MatchCard from inline styles to Tailwind CSS, add predictionCount prop with display, support dark mode, update navigation to /match/:matchId route.

## Important Decisions

- Navigation updated from `/predict/${match.id}` to `/match/${match.id}` to match the new routing in App.jsx (task_07).
- Prediction count displayed inline with group name/time line (e.g., "Grupo A • 20/06 • 8 palpites").
- `predictionCount` defaults to 0 in MatchCard prop to avoid undefined issues.

## Learnings

- Team names render with flag emoji in the same element, causing `getByText('Brasil')` to fail; must use regex `/Brasil/` in tests.
- ESLint config is missing from the project (pre-existing).
- Build and all 119 tests pass, no regressions introduced.

## Files / Surfaces

- `src/components/MatchCard.jsx` — fully rewritten: inline styles removed, Tailwind classes added, predictionCount prop added, navigation route updated.
- `src/pages/Matches.jsx` — updated to destructure `predictionCounts` from `useMatches()` and pass `predictionCount` prop to all three MatchCard instances.
- `src/components/__tests__/MatchCard.test.jsx` — new file with 22 unit tests covering Tailwind classes, prediction count display, Palpitado badge, status badge colors, score display, navigation behavior.

## Errors / Corrections

- Initial test for team names used exact string `getByText('Brasil')` which failed because the flag emoji + text are in the same element. Fixed with regex `/Brasil/`.
- Navigate test initially had a duplicate `renderCard()` call. Removed the duplicate.

## Ready for Next Run

Task complete. All requirements met.
