---
status: pending
title: Leaderboard + Realtime + Podium
type: frontend
complexity: medium
dependencies: [task_03, task_04, task_11]
---

## Overview

Implement the `useLeaderboard` hook with Supabase Realtime subscription, the `Leaderboard` page with full rankings, and the `Podium` component that highlights the top 3 participants.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "API & Integration Design — Realtime Subscription" and PRD "Core Features — Leaderboard".
- Focus on real-time updates and correct ranking display — not prediction details.
- The leaderboard is read from the `leaderboard` view, not computed client-side.
- Tests are required.
</critical>

<requirements>
1. MUST implement `useLeaderboard` hook that queries the `leaderboard` view ordered by `total_points DESC`.
2. MUST subscribe to `predictions` table changes via Supabase Realtime and re-fetch the leaderboard when points are updated.
3. MUST expose `{ leaderboard, loading, error }` from the hook.
4. MUST implement `LeaderboardRow` component showing: rank position, avatar (from Google), name, total points.
5. MUST highlight the current user's row visually.
6. MUST implement `Podium` component showing top 3 with distinct visual treatment (1st, 2nd, 3rd).
7. MUST implement `Leaderboard` page composing `Podium` + full ranked list.
8. MUST show an empty state when no predictions have been made yet.
9. MUST unsubscribe from Realtime channel on component unmount.
</requirements>

## Subtasks

- [ ] Implement `useLeaderboard` hook with initial fetch and Realtime subscription.
- [ ] Implement `LeaderboardRow` component with current-user highlight.
- [ ] Implement `Podium` component for top 3.
- [ ] Implement `Leaderboard` page composing both components.
- [ ] Implement empty state.
- [ ] Ensure Realtime unsubscribe on unmount.

## Implementation Details

Files to modify/create:
- `src/hooks/useLeaderboard.js` — full implementation.
- `src/components/LeaderboardRow.jsx` — full implementation.
- `src/components/Podium.jsx` — full implementation.
- `src/pages/Leaderboard.jsx` — full implementation.

### Relevant Files
- `src/lib/supabase.js`
- `src/hooks/useAuth.js` — for current user ID (to highlight own row).

### Dependent Files
- None — this is a terminal feature with no dependents.

### Related ADRs
- ADR-002: Supabase Realtime.

## Deliverables

- Leaderboard renders correctly with seeded data.
- Podium shows correct top 3.
- Current user's row is highlighted.
- Leaderboard updates automatically within seconds of a points change.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `useLeaderboard` returns `loading: true` initially, then data on resolve.
- [ ] `useLeaderboard` returns `error` when query fails.
- [ ] `LeaderboardRow` highlights the row when `isCurrentUser` is true.
- [ ] `LeaderboardRow` does not highlight when `isCurrentUser` is false.
- [ ] `Podium` renders exactly 3 items when leaderboard has >= 3 participants.
- [ ] `Podium` renders fewer items gracefully when leaderboard has < 3 participants.
- [ ] Realtime subscription is cleaned up on unmount (channel unsubscribed).

### Integration Tests
- [ ] Leaderboard re-fetches after a `predictions` table change event is emitted.
- [ ] Empty state renders when `leaderboard` view returns 0 rows.
- [ ] Current user's row is visually distinct from others.

## Success Criteria

- Leaderboard updates in real time after a match result is synced.
- Podium and full rankings render correctly.
- No memory leaks (Realtime channel unsubscribed on unmount).
- Test coverage >= 80%.
