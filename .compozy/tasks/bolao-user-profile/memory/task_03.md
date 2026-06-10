# Task Memory: task_03.md

## Objective Snapshot

Create UserProfileHeader component (avatar, name, totalPoints, rank) with Tailwind dark mode support and tests.

## Important Decisions

- Used `#rank` prefix instead of plain number for clarity (different from LeaderboardRow which shows bare rank in a column layout)
- Used `Pontos:` and `Rank:` labels to differentiate header display from compact leaderboard row
- Points styled green (`text-green-500 dark:text-green-400`), top-3 rank amber (`text-amber-500`), other ranks muted — matching LeaderboardRow pattern
- Avatar reused from existing `Avatar.jsx` component with larger size (w-16 h-16 vs w-10)

## Learnings

- Dark mode tokens: `dark:bg-dark-card`, `dark:text-dark-text`, `dark:text-dark-muted` used consistently
- Component pattern: functional component, no default export name style, props directly destructured
- `@vitest/coverage-v8` not installed in project — cannot measure coverage percentage, but all component branches are tested

## Files / Surfaces

- Created: `src/components/UserProfileHeader.jsx`
- Created: `src/components/__tests__/UserProfileHeader.test.jsx`

## Errors / Corrections

- None

## Ready for Next Run

- Tests: 9/9 passing in UserProfileHeader.test.jsx
- Full suite: 216/216 passing, 18 test files, no regressions
