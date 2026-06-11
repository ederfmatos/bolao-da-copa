# Task Memory: task_10.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Create migration 0009 with two pg_cron jobs: daily-digest at 08:00 America/Sao_Paulo and deadline-reminder every 15 minutes. Both call send-notifications edge function via pg_net with vault secret auth.

## Important Decisions

- Used `cron.unschedule()` wrapped in DO/EXCEPTION blocks for idempotency (unschedule fails gracefully if job doesn't exist yet)
- Used pg_cron's 4th parameter for timezone (`'America/Sao_Paulo'`) on both jobs per ADR-005
- Migration number 0009 (next available after 0008)

## Learnings

- `cron.schedule()` in pg_cron accepts timezone as 4th parameter: `cron.schedule(name, schedule, command, timezone)`
- Test section extraction must target `cron.schedule(` calls, not just job name strings (job names appear in both unschedule and schedule blocks)

## Files / Surfaces

- Created: `supabase/migrations/0009_cron_notifications.sql`
- Created: `supabase/migrations/__tests__/0009_cron_notifications.test.js`
- Referenced: `supabase/migrations/0002_cron_schedule.sql` (pattern reference)
- Referenced: `supabase/functions/send-notifications/index.ts` (target function)

## Errors / Corrections

- Initial test extracted daily-digest section from first occurrence of job name (in unschedule block), not the schedule block. Fixed by targeting `cron.schedule(\n  'daily-digest-8am'` as the section start.

## Ready for Next Run

Task 10 is complete. All tasks in the PRD are now completed.
