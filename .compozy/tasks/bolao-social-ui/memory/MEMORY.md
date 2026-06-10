# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- Task 02 complete: ThemeContext created, vitest + testing-library setup done.
- Task 04 complete: useMatchPredictions hook created with 10 tests.
- Task 08 complete: MatchDetails page created with tests.
- Task 09 complete: PredictionRow verified, 20 unit tests created; component existed from task_08.
- Task 12 complete: Leaderboard page, LeaderboardRow, and Podium migrated to Tailwind; 29 new tests added.

## Shared Decisions

- Use vitest (v4) with jsdom environment, @testing-library/react, and @testing-library/jest-dom for all frontend tests.
- `test-setup.js` provides a default `window.matchMedia` mock for all test files.

## Shared Learnings

- Tailwind CSS v4 (latest) drops `tailwind.config.js` and `npx tailwindcss init` CLI. This project uses v3 intentionally for config-based setup with `darkMode: 'class'` and custom colors. Do not upgrade to v4 without re-evaluating the configuration approach.
- `vi.mock` paths resolve relative to the test file, not the source file. Tests in `src/hooks/__tests__/` need `../../lib/supabase` to mock `src/lib/supabase`. Use `vi.hoisted()` for mock setup to avoid vitest hoisting/TDZ issues.
- The supabase builder mock needs `.single()` in the chain for page-level tests that fetch single records. Hook-level tests only mock `.select().eq().order().then()`.
- PredictionRow component already exists (created in task_08 alongside MatchDetails). Task 09 should verify/enhance it rather than recreating.

## Open Risks

## Shared Learnings (cont.)

- Page-level tests should assert `container.querySelectorAll('[style]').length === 0` to verify no inline styles remain after Tailwind migration.
- Use `data-*` attributes on mocked child components to verify prop passing (e.g., `data-prediction-count`, `data-has-prediction`) in page tests.

## Completed

- Task 16 complete: Build verification passed — 0 build errors, 187/187 tests passed, no inline styles in active components, gzipped output ~137 KB (under 500 KB target).

## Handoffs
