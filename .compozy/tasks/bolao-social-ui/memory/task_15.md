# Task Memory: task_15.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Migrate ScorePicker and ProtectedRoute inline styles to Tailwind CSS.

## Important Decisions

- ScorePicker button styles use a computed `btnBase` className string (via `.join(' ')`) instead of a ternary on each button instance, keeping it DRY.
- Used the same test patterns as other component tests: `renderPicker` helper, `fireEvent` for click, `container.querySelectorAll('[style]')` for inline-style verification.

## Learnings

- The first test `'renders without errors'` failed initially because `getByText('0')` matched two elements (home and away score both 0). Fixed with `getAllByText`.

## Files / Surfaces

- Modified: `src/components/ScorePicker.jsx` — migrated all inline styles to Tailwind
- Modified: `src/components/ProtectedRoute.jsx` — migrated inline style to Tailwind
- Created: `src/components/__tests__/ScorePicker.test.jsx` — 13 unit tests

## Errors / Corrections

- ESLint is not configured in this project (`eslint.config.*` missing). Pre-existing issue, not related to this task.

## Ready for Next Run

- All 187 tests pass (13 new ScorePicker tests).
- No inline styles remain in ScorePicker or ProtectedRoute.
