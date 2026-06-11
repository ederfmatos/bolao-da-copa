---
status: completed
title: "Cron jobs migration (daily-digest + deadline-reminder)"
type: infra
complexity: low
dependencies:
  - task_04
---

# Task 10: Cron jobs migration (daily-digest + deadline-reminder)

## Overview
Create a database migration to schedule cron jobs for daily digest and deadline reminder notifications. These jobs use pg_cron and pg_net to invoke the send-notifications edge function at specific times, following the established pattern from the existing sync-matches cron job.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create migration file following naming convention: NNNN_descriptive_name.sql
- MUST create cron job for daily-digest notification at 08:00 America/Sao_Paulo
- MUST create cron job for deadline-reminder notification every 15 minutes
- MUST use pg_cron extension (already enabled in migration 0002)
- MUST use pg_net extension for HTTP calls (already enabled in migration 0002)
- MUST follow cron job pattern from migration 0002_cron_schedule.sql
- MUST use vault secrets for Supabase URL and service role key
- MUST pass correct notification type and data to send-notifications function
- MUST be idempotent (can be run multiple times safely)
- MUST include descriptive job names for monitoring
</requirements>

## Subtasks
- [x] 10.1 Create migration file with header comment
- [x] 10.2 Create daily-digest cron job (08:00 America/Sao_Paulo)
- [x] 10.3 Configure daily-digest to call send-notifications with type 'daily-digest'
- [x] 10.4 Create deadline-reminder cron job (every 15 minutes)
- [x] 10.5 Configure deadline-reminder to call send-notifications with type 'deadline-reminder'
- [x] 10.6 Use vault secrets for authentication
- [x] 10.7 Add descriptive job names
- [x] 10.8 Verify migration syntax and cron expressions

## Implementation Details
Create a new migration file following the pattern from `0002_cron_schedule.sql`. The migration must create two cron jobs using `cron.schedule()`. The daily-digest job must run at 08:00 America/Sao_Paulo timezone and call the send-notifications function with type 'daily-digest'. The deadline-reminder job must run every 15 minutes and call send-notifications with type 'deadline-reminder'. Both jobs must use pg_net to make HTTP POST requests to the edge function, with authentication via service role key stored in vault secrets.

### Relevant Files
- `supabase/migrations/0002_cron_schedule.sql` — Reference for cron job pattern, pg_net usage, and vault secrets
- `supabase/functions/send-notifications/index.ts` — Function to be called (task_04)

### Dependent Files
- `supabase/migrations/0009_cron_notifications.sql` — File to be created (or next available number)
- Cron scheduler — Will execute these jobs

### Related ADRs
- [ADR-005: Fixed Brasília Timezone](../adrs/adr-005.md) — Timezone handling for cron jobs

## Deliverables
- Migration file created with correct naming
- Daily-digest cron job scheduled at 08:00
- Deadline-reminder cron job scheduled every 15 minutes
- Vault secrets used for authentication
- Descriptive job names for monitoring
- SQL syntax validated
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Migration file exists at correct path
  - [x] Daily-digest cron job is created with correct name
  - [x] Daily-digest cron expression is '0 8 * * *' (08:00)
  - [x] Daily-digest calls send-notifications with type 'daily-digest'
  - [x] Deadline-reminder cron job is created with correct name
  - [x] Deadline-reminder cron expression is '*/15 * * * *' (every 15 min)
  - [x] Deadline-reminder calls send-notifications with type 'deadline-reminder'
  - [x] Both jobs use vault secrets for authentication
  - [x] Both jobs use pg_net for HTTP calls
  - [x] Migration is idempotent (can be run multiple times)
- Integration tests:
  - [ ] Migration can be applied to test database without errors
  - [ ] Cron jobs are visible in cron.job table
  - [ ] Cron jobs can be executed manually for testing
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Migration file follows project naming convention
- Cron jobs are scheduled correctly
- Timezone is set to America/Sao_Paulo
- Authentication uses vault secrets
- Migration is idempotent
