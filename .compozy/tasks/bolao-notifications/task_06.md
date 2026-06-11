---
status: completed
title: "useNotifications hook"
type: frontend
complexity: medium
dependencies:
  - task_03
---

# Task 06: useNotifications hook

## Overview
Create a React hook for managing push notification permissions and subscriptions. This hook provides the interface for requesting browser permission, subscribing to push notifications, registering the subscription with the backend, and checking notification status. It follows the established hook pattern from the project.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create src/hooks/useNotifications.js following project hook conventions
- MUST export named function useNotifications (not default export)
- MUST return { permission, subscribed, loading, error, requestPermission, unsubscribe }
- MUST check Notification.permission on mount
- MUST check for existing push subscription on mount
- MUST request browser permission via Notification.requestPermission()
- MUST subscribe to push via PushManager.subscribe() with VAPID public key
- MUST register subscription with backend via /functions/v1/register-subscription (task_03)
- MUST read VAPID public key from VITE_VAPID_PUBLIC_KEY environment variable
- MUST handle permission denial gracefully
- MUST handle subscription failures with error state
- MUST support unsubscribe flow (remove subscription from backend)
- MUST use supabase.auth.getSession() for authentication
- MUST follow error handling pattern from other hooks
</requirements>

## Subtasks
- [x] 6.1 Create useNotifications.js hook file
- [x] 6.2 Implement permission state checking on mount
- [x] 6.3 Implement existing subscription checking on mount
- [x] 6.4 Implement requestPermission function
- [x] 6.5 Implement subscribe function with PushManager.subscribe()
- [x] 6.6 Implement backend registration via register-subscription endpoint
- [x] 6.7 Implement unsubscribe function
- [x] 6.8 Add loading and error state management
- [x] 6.9 Add authentication via supabase.auth.getSession()
- [x] 6.10 Add VAPID public key from environment variable

## Implementation Details
Create a hook following the pattern from `useAuth.js` and `usePredictions.js`. The hook must manage the full lifecycle of push notification subscriptions: checking current permission status, requesting permission, subscribing to push, registering with the backend, and unsubscribing. It must use the browser's Notification API and PushManager API, and communicate with the register-subscription edge function (task_03) to persist the subscription. The hook must handle all error cases gracefully and provide clear state for the UI to react to.

### Relevant Files
- `src/hooks/useAuth.js` — Reference for auth-dependent hook pattern
- `src/hooks/usePredictions.js` — Reference for hook with mutation functions
- `src/lib/supabase.js` — Supabase client for auth and API calls
- `supabase/functions/register-subscription/index.ts` — Backend endpoint (task_03)

### Dependent Files
- `src/hooks/useNotifications.js` — File to be created
- `src/components/NotificationPrompt.jsx` — Will use this hook (task_07)
- `src/components/NotificationToggle.jsx` — Will use this hook (task_08)
- `.env.example` — Must add VITE_VAPID_PUBLIC_KEY

### Related ADRs
- [ADR-002: deno-web-push Library](../adrs/adr-002.md) — VAPID keys must match between frontend and backend

## Deliverables
- Hook file `src/hooks/useNotifications.js` created
- Permission checking implemented
- Subscription flow implemented
- Backend registration integrated
- Unsubscribe flow implemented
- Loading and error states managed
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Hook returns correct shape: { permission, subscribed, loading, error, requestPermission, unsubscribe }
  - [x] Permission is checked on mount
  - [x] Existing subscription is detected on mount
  - [x] requestPermission calls Notification.requestPermission()
  - [x] Permission granted updates permission state
  - [x] Permission denied updates permission state to 'denied'
  - [x] Subscribe calls PushManager.subscribe() with VAPID key
  - [x] Subscribe calls register-subscription endpoint
  - [x] Subscribe sets subscribed state to true on success
  - [x] Subscribe sets error state on failure
  - [x] Unsubscribe calls register-subscription DELETE endpoint
  - [x] Unsubscribe sets subscribed state to false
  - [x] Loading state is true during async operations
  - [x] Error state contains error message on failure
  - [x] Hook handles missing Notification API gracefully
  - [x] Hook handles missing PushManager gracefully
  - [x] VAPID public key is read from environment variable
- Integration tests:
  - [x] Full opt-in flow: request permission → subscribe → register
  - [x] Full opt-out flow: unsubscribe → remove from backend
  - [x] Hook works with authenticated user
  - [x] Hook handles unauthenticated state
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Hook follows project conventions
- Permission and subscription states are managed correctly
- Error handling covers all failure modes
- Integration with backend endpoint works correctly
