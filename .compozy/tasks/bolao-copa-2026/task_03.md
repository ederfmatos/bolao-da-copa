---
status: completed
title: Vite + React scaffold & Supabase client
type: frontend
complexity: low
dependencies: [task_01]
---

## Overview

Bootstrap the React SPA with Vite, configure the Supabase JS client singleton, set up routing, and establish the folder structure that all frontend tasks will build on.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Frontend Architecture" for the exact folder structure and file names.
- Focus on scaffold only — no feature logic in this task.
- Minimize dependencies — install only what is confirmed needed.
- Tests are required.
</critical>

<requirements>
1. MUST scaffold project with `npm create vite@latest` using the React template.
2. MUST install `@supabase/supabase-js` and create `src/lib/supabase.js` as the singleton client.
3. MUST read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment variables — never hardcode.
4. MUST create `.env.local` (gitignored) and `.env.example` with placeholder values.
5. MUST set up React Router with placeholder routes for all pages: `/`, `/matches`, `/predict/:matchId`, `/leaderboard`, `/rules`.
6. MUST implement the folder structure defined in TechSpec "Frontend Architecture" section.
7. SHOULD configure ESLint and Prettier for code consistency.
</requirements>

## Subtasks

- [ ] Run `npm create vite@latest` with React template; clean up boilerplate.
- [ ] Install `@supabase/supabase-js` and `react-router-dom`.
- [ ] Create `src/lib/supabase.js` singleton.
- [ ] Create `.env.local`, `.env.example`, and add `.env.local` to `.gitignore`.
- [ ] Set up `App.jsx` with React Router and placeholder page components.
- [ ] Create empty files for all hooks and pages per TechSpec folder structure.

## Implementation Details

Files to create (see TechSpec "Frontend Architecture"):
- `src/main.jsx`
- `src/App.jsx` — router setup
- `src/lib/supabase.js` — Supabase client singleton
- `src/hooks/useAuth.js` (empty)
- `src/hooks/useMatches.js` (empty)
- `src/hooks/usePredictions.js` (empty)
- `src/hooks/useLeaderboard.js` (empty)
- `src/pages/Login.jsx` (placeholder)
- `src/pages/Home.jsx` (placeholder)
- `src/pages/Matches.jsx` (placeholder)
- `src/pages/Predict.jsx` (placeholder)
- `src/pages/Leaderboard.jsx` (placeholder)
- `src/pages/Rules.jsx` (placeholder)
- `src/components/MatchCard.jsx` (empty)
- `src/components/ScorePicker.jsx` (empty)
- `src/components/LeaderboardRow.jsx` (empty)
- `src/components/Podium.jsx` (empty)
- `.env.example`

### Relevant Files
- `vite.config.js` — may need proxy config for local Supabase.

### Dependent Files
- All `src/hooks/*.js` and `src/pages/*.jsx` files — created as empty stubs here, filled in subsequent tasks.

### Related ADRs
- ADR-004: React SPA com Vite, deploy na Vercel.

## Deliverables

- `npm run dev` starts the app without errors.
- All routes render placeholder components without crashing.
- Supabase client initializes correctly from env vars.
- `.env.local` is gitignored; `.env.example` is committed.
- Test coverage >= 80% for the Supabase client module.

## Tests

### Unit Tests
- [ ] `src/lib/supabase.js` throws a clear error if `VITE_SUPABASE_URL` is missing.
- [ ] `src/lib/supabase.js` throws a clear error if `VITE_SUPABASE_ANON_KEY` is missing.
- [ ] Supabase client singleton returns the same instance on multiple imports.

### Integration Tests
- [ ] Navigating to `/` renders the Login placeholder without console errors.
- [ ] Navigating to `/matches` renders the Matches placeholder without console errors.
- [ ] Navigating to an unknown route renders a 404 or redirects to `/`.

## Success Criteria

- `npm run dev` and `npm run build` complete without errors.
- All placeholder routes accessible in browser.
- Supabase client unit tests pass.
- Test coverage >= 80%.
