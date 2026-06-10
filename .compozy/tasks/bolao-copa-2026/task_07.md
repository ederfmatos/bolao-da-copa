---
status: completed
title: sync-matches Edge Function + cron
type: backend
complexity: high
dependencies: [task_05, task_06]
---

## Overview

Implement the `sync-matches` Supabase Edge Function that fetches matches from the provider chain and upserts them into the `matches` table. Schedule it to run every 5 minutes via `pg_cron`. This is the core data pipeline of the application.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "API & Integration Design — Edge Function: sync-matches" for the full logic spec.
- Focus on correct upsert behavior and status transition detection — points calculation is task_11.
- Use the Supabase service role key for DB writes; never expose it to the frontend.
- Tests are required.
</critical>

<requirements>
1. MUST implement `supabase/functions/sync-matches/index.ts` as a Deno Edge Function.
2. MUST call `fetchWithFallback(defaultChain)` from task_06 to retrieve match data.
3. MUST upsert all fetched matches into the `matches` table using `onConflict: 'id'`.
4. MUST detect matches that transitioned to `status = 'finished'` in this sync cycle.
5. MUST emit a list of newly-finished match IDs for task_11's points calculation logic to consume (via a shared utility or direct call).
6. MUST use `SUPABASE_SERVICE_ROLE_KEY` for all DB write operations.
7. MUST schedule the function to run every 5 minutes using `pg_cron`.
8. MUST also be triggerable via HTTP POST for manual initial data load.
9. SHOULD log total matches upserted and number of newly-finished matches per run.
10. SHOULD handle the case where all providers fail gracefully — log the error and return a 500 without crashing the runtime.
</requirements>

## Subtasks

- [ ] Create `supabase/functions/sync-matches/index.ts` with fetch → upsert loop.
- [ ] Detect status transitions to `'finished'` by comparing fetched status vs. current DB status.
- [ ] Implement HTTP handler that allows manual triggering via POST.
- [ ] Create `pg_cron` schedule in a new migration file (`0002_cron_schedule.sql`).
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_DATA_API_KEY`, `API_FOOTBALL_KEY` to Supabase Edge Function secrets.
- [ ] Write unit tests for upsert logic and status transition detection.

## Implementation Details

Files to create:
- `supabase/functions/sync-matches/index.ts`
- `supabase/migrations/0002_cron_schedule.sql` — `pg_cron` setup.

Reference TechSpec "API & Integration Design — Edge Function: sync-matches" for the full step-by-step logic.

### Relevant Files
- `supabase/functions/sync-matches/providers/index.ts` (task_06)
- `supabase/migrations/0001_initial_schema.sql` — `matches` table definition (task_01).

### Dependent Files
- `supabase/functions/sync-matches/index.ts` — task_11 will extend this to trigger points calculation after detecting finished matches.

### Related ADRs
- ADR-002: Supabase como plataforma principal (Edge Functions + pg_cron).
- ADR-003: Multi-provider com fallback.

## Deliverables

- Edge Function deployed and callable via HTTP.
- `pg_cron` job running every 5 minutes.
- `matches` table populated after first manual trigger.
- Status transition detection working correctly.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] Upsert with new matches inserts all rows.
- [ ] Upsert with existing matches updates `status`, `home_score`, `away_score`, `synced_at`.
- [ ] Status transition detection: match previously `'live'` now `'finished'` → included in newly-finished list.
- [ ] Status transition detection: match already `'finished'` in DB → NOT included in newly-finished list.
- [ ] Function returns 500 and logs error when all providers fail; does not throw unhandled exception.
- [ ] Function returns 200 with summary log on success.

### Integration Tests
- [ ] HTTP POST to the function URL upserts matches into the `matches` table.
- [ ] Running the function twice does not create duplicate rows.
- [ ] `pg_cron` job is registered and visible in `cron.job` table.

## Success Criteria

- Manual HTTP trigger populates `matches` table with all 2026 World Cup fixtures.
- Cron job runs every 5 minutes without errors.
- Status transition detection passes all unit tests.
- Test coverage >= 80%.
