# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Implement useNotifications hook for managing push notification permissions and subscriptions.

## Important Decisions

- Removed `useCallback` wrapper from `requestPermission` and `unsubscribe` — follows project pattern from `usePredictions.js` where mutation functions are plain async functions
- `requestPermission` handles full opt-in flow: permission request → PushManager.subscribe → backend registration
- `unsubscribe` handles full opt-out flow: backend DELETE → PushSubscription.unsubscribe
- Backend registration uses same endpoint (`register-subscription`) with POST for register and DELETE for unregister

## Learnings

- `useAuth` mock in tests must return a stable `user` reference (via `vi.hoisted`), otherwise the `useEffect` dependency on `user` re-triggers on every render and overwrites state updates
- `act` + `waitFor` pattern needed for state assertions after async operations in React 19

## Files / Surfaces

- `src/hooks/useNotifications.js` — Created
- `src/hooks/__tests__/useNotifications.test.jsx` — Created (29 tests)
- `.env.example` — Added VITE_VAPID_PUBLIC_KEY

## Errors / Corrections

- Initial test failures (6/29) caused by unstable `user` reference in `useAuth` mock — `useEffect` re-ran on each render, resetting `permission` state to 'default'

## Ready for Next Run

Task 06 is complete. Tasks 07 (NotificationPrompt) and 08 (NotificationToggle) are unblocked.
