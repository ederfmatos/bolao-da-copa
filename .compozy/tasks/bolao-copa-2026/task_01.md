---
status: pending
title: Supabase project setup & schema migrations
type: infra
complexity: medium
dependencies: []
---

## Overview

Create and configure the Supabase project that serves as the sole backend platform for the app. This task establishes the database schema, Row Level Security policies, and the leaderboard view that all subsequent tasks depend on.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Data Models" and "API & Integration Design" sections for schema and RLS definitions.
- Focus on WHAT needs to exist (tables, policies, view), not on application code.
- Minimize custom SQL — prefer Supabase built-ins where possible.
- Tests are required: migration must be idempotent and RLS policies must be verified.
</critical>

<requirements>
1. MUST create a Supabase project and note the project URL and anon key.
2. MUST run migrations that create `profiles`, `matches`, and `predictions` tables exactly as defined in TechSpec "Data Models".
3. MUST create the `leaderboard` view as defined in TechSpec.
4. MUST enable RLS on all three tables and apply the policies defined in TechSpec "API & Integration Design — RLS".
5. MUST create a `handle_new_user` trigger on `auth.users` that auto-inserts a row into `profiles` on sign-up.
6. MUST create a `predictions_before_deadline` policy that prevents insert/update within 1 hour of kickoff.
7. SHOULD store all migration SQL in `supabase/migrations/` for version control.
8. SHOULD enable Supabase Realtime for the `predictions` table.
</requirements>

## Subtasks

- [ ] Create Supabase project via dashboard and record URL + anon key.
- [ ] Write migration file for `profiles`, `matches`, `predictions` tables and `leaderboard` view.
- [ ] Enable RLS and apply read/write policies for each table.
- [ ] Add `handle_new_user` trigger function for auto-profile creation.
- [ ] Enable Realtime publication on `predictions` table.
- [ ] Verify deadline enforcement policy blocks inserts within the 1-hour window.

## Implementation Details

Files to create:
- `supabase/migrations/0001_initial_schema.sql` — all table definitions, view, RLS, trigger.

Reference TechSpec "Data Models" for exact column types and constraints. Reference TechSpec "API & Integration Design — RLS" for policy SQL.

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` (to create)

### Dependent Files
- `src/lib/supabase.js` — will import `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured here.
- `supabase/functions/sync-matches/index.ts` — uses service role key from this project.

### Related ADRs
- ADR-002: Supabase como plataforma principal.

## Deliverables

- `supabase/migrations/0001_initial_schema.sql` applied successfully to the project.
- All three tables visible in Supabase Table Editor with correct columns and constraints.
- `leaderboard` view queryable and returning correct aggregated data.
- RLS policies active and tested.
- Test coverage >= 80% for RLS policy logic (via Supabase SQL test scripts or pgTAP).

## Tests

### Unit Tests
- [ ] Migration is idempotent — running it twice produces no errors.
- [ ] `profiles` table enforces FK to `auth.users`.
- [ ] `predictions` table enforces unique (user_id, match_id).
- [ ] `predictions.home_score` and `away_score` reject negative values.
- [ ] `matches.status` rejects values outside ('scheduled', 'live', 'finished').

### Integration Tests
- [ ] Authenticated user can read all rows from `matches`.
- [ ] Authenticated user can only read their own rows from `predictions`.
- [ ] Authenticated user cannot insert a prediction for a match starting in less than 1 hour.
- [ ] Unauthenticated request to `matches` is rejected.
- [ ] `leaderboard` view returns correct point totals after inserting sample predictions with known scores.

## Success Criteria

- All migrations apply cleanly to a fresh Supabase project.
- All RLS integration tests pass.
- Test coverage >= 80%.
- `leaderboard` view returns correct ranking for a seeded dataset.
