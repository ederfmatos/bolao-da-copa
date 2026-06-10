---
status: completed
title: Auth flow — Login page & useAuth hook
type: frontend
complexity: low
dependencies: [task_02, task_03]
---

## Overview

Implement the `useAuth` hook and Login page so users can sign in with Google and be redirected to the app. Also implement route protection so unauthenticated users are always redirected to the login page.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Frontend Architecture" for hook and page file locations.
- Focus on auth state management and route protection — not visual design.
- Use Supabase Auth built-ins; do not implement custom token handling.
- Tests are required.
</critical>

<requirements>
1. MUST implement `useAuth` hook that exposes `{ user, session, signInWithGoogle, signOut, loading }`.
2. MUST use `supabase.auth.onAuthStateChange` to keep session state in sync.
3. MUST implement `Login.jsx` with a single "Continue with Google" button that calls `signInWithGoogle`.
4. MUST implement a `ProtectedRoute` component that redirects unauthenticated users to `/`.
5. MUST wrap all non-login routes in `ProtectedRoute` inside `App.jsx`.
6. MUST redirect authenticated users away from `/` to `/matches`.
7. SHOULD handle the OAuth redirect callback correctly (Supabase handles this automatically via `onAuthStateChange`).
</requirements>

## Subtasks

- [ ] Implement `useAuth` hook with `onAuthStateChange` listener and `signInWithGoogle`.
- [ ] Implement `Login.jsx` with Google sign-in button.
- [ ] Implement `ProtectedRoute` component.
- [ ] Update `App.jsx` to wrap protected routes and redirect authenticated users from `/`.
- [ ] Test sign-in → redirect → sign-out → redirect back to login flow.

## Implementation Details

Files to modify/create:
- `src/hooks/useAuth.js` — full implementation.
- `src/pages/Login.jsx` — full implementation.
- `src/components/ProtectedRoute.jsx` — new file.
- `src/App.jsx` — add ProtectedRoute wrapping and auth redirect.

### Relevant Files
- `src/lib/supabase.js` — Supabase client used by `useAuth`.

### Dependent Files
- All `src/pages/*.jsx` (except Login) — will be wrapped in `ProtectedRoute`.
- `src/hooks/useMatches.js`, `usePredictions.js`, `useLeaderboard.js` — will access `user` from `useAuth`.

### Related ADRs
- ADR-002: Supabase Auth nativo.

## Deliverables

- Unauthenticated users see Login page on any route.
- Google sign-in completes and redirects to `/matches`.
- Sign-out redirects to `/`.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `useAuth` initializes with `loading: true` then resolves to correct state.
- [ ] `useAuth` returns `user: null` when no session exists.
- [ ] `useAuth` returns user object after mock sign-in.
- [ ] `signInWithGoogle` calls `supabase.auth.signInWithOAuth` with `{ provider: 'google' }`.

### Integration Tests
- [ ] Visiting `/matches` without a session redirects to `/`.
- [ ] Visiting `/` with an active session redirects to `/matches`.
- [ ] After sign-out, visiting `/leaderboard` redirects to `/`.

## Success Criteria

- All auth flow integration tests pass.
- No authenticated routes accessible without a session.
- Test coverage >= 80%.
