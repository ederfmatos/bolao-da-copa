---
status: pending
title: Match list — useMatches hook + Matches page
type: frontend
complexity: medium
dependencies: [task_03, task_04, task_07]
---

## Overview

Implement the `useMatches` hook that fetches matches from Supabase and the `Matches` page that displays them grouped by status (open, closed, finished). This is the primary navigation screen of the app.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Frontend Architecture" for hook and component structure.
- Focus on data fetching, grouping, and deadline display — not prediction input (task_10).
- Convert all UTC timestamps to the user's local timezone in the UI layer only.
- Tests are required.
</critical>

<requirements>
1. MUST implement `useMatches` hook that fetches all matches from the `matches` table ordered by `kickoff_at`.
2. MUST expose `{ matches, loading, error }` from the hook.
3. MUST group matches into: open for prediction (status = 'scheduled' AND kickoff_at > now + 1h), closed (within 1h window or status = 'live'), finished.
4. MUST display each match with: home/away team names, flags, group name, local date and time, and status badge.
5. MUST show a visual indicator on matches that already have a prediction from the current user.
6. MUST display an empty state when no open matches are available, showing the next upcoming match with its kickoff time.
7. MUST display kickoff times in the user's local timezone (use `Intl.DateTimeFormat`).
8. Open matches MUST be tappable and navigate to `/predict/:matchId`.
9. Finished and closed matches MUST NOT be tappable.
</requirements>

## Subtasks

- [ ] Implement `useMatches` hook with Supabase query.
- [ ] Implement `MatchCard` component with status badge and prediction indicator.
- [ ] Implement `Matches` page with three sections (open, closed, finished).
- [ ] Implement empty state for when no open matches exist.
- [ ] Add local timezone formatting for kickoff times.
- [ ] Fetch current user's predictions to display the "already predicted" indicator.

## Implementation Details

Files to modify/create:
- `src/hooks/useMatches.js` — full implementation.
- `src/components/MatchCard.jsx` — full implementation.
- `src/pages/Matches.jsx` — full implementation.

### Relevant Files
- `src/lib/supabase.js` — Supabase client.
- `src/hooks/useAuth.js` — for current user ID (to check existing predictions).
- `src/hooks/usePredictions.js` — will be called alongside this hook to show prediction indicators.

### Dependent Files
- `src/pages/Predict.jsx` — navigated to from MatchCard (task_10).

### Related ADRs
- None.

## Deliverables

- `Matches` page renders all three match sections correctly.
- Timezone conversion works for at least UTC, BRT, and CET.
- Prediction indicator shown on cards with existing predictions.
- Empty state renders when no open matches.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `useMatches` returns `loading: true` initially, then `loading: false` with data.
- [ ] `useMatches` returns `error` when Supabase query fails.
- [ ] Match grouping: match with `kickoff_at > now + 1h` and status `scheduled` → open group.
- [ ] Match grouping: match with `kickoff_at <= now + 1h` and status `scheduled` → closed group.
- [ ] Match grouping: match with status `finished` → finished group regardless of kickoff time.
- [ ] `MatchCard` renders home team, away team, group name, and status badge.
- [ ] `MatchCard` renders prediction indicator when prediction exists.
- [ ] `MatchCard` does not render prediction indicator when no prediction.

### Integration Tests
- [ ] Tapping an open `MatchCard` navigates to `/predict/:matchId`.
- [ ] Tapping a finished `MatchCard` does nothing (no navigation).
- [ ] Empty state renders when `matches` array has no open matches.
- [ ] Kickoff time displayed in user's local timezone (mock `Intl.DateTimeFormat`).

## Success Criteria

- `Matches` page renders correctly with seeded match data.
- Grouping logic passes all unit tests.
- Navigation to prediction screen works.
- Test coverage >= 80%.
