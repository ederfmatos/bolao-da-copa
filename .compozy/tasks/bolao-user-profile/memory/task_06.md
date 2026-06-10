# Task Memory: task_06.md

## Objective Snapshot

Create UserProfile.jsx page with UserProfileHeader, UserStats, and prediction list, fetching user data from useUserPredictions and useLeaderboard hooks.

## Important Decisions

- Page uses `useLeaderboard()` to find user profile info (name, avatar_url, total_points) instead of a separate profile hook. Rank computed via `findIndex + 1` on sorted leaderboard.
- Avatar URL can be null from leaderboard — UserProfileHeader handles null avatar via Avatar component.
- Uses `navigate(-1)` for back button to preserve context, matching MatchDetails pattern.

## Learnings

- Leaderboard entries have: `user_id`, `name`, `avatar_url`, `total_points`, `total_predictions`
- `useUserPredictions(userId)` returns `{ predictions, loading, error }` from `user_predictions` view
- Mocking `useNavigate` requires re-importing `react-router-dom` with async mock to preserve other exports

## Files / Surfaces

- Created `src/pages/UserProfile.jsx`
- Created `src/pages/__tests__/UserProfile.test.jsx`

## Errors / Corrections

- Test `page handles user with avatar_url as null` initially failed because JSX `data-avatar={null}` omits the attribute. Fixed to use `not.toHaveAttribute('data-avatar')`.

## Ready for Next Run

Yes — 12 tests passing, 100% coverage.
