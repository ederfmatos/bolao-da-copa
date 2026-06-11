---
status: completed
title: "Migration 0008: push_subscriptions table + RLS"
type: infra
complexity: low
dependencies: []
---

# Task 01: Migration 0008: push_subscriptions table + RLS

## Overview
Create the database schema for storing Web Push subscriptions. This is the foundation for the entire notification system — without this table, no other component can function.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `push_subscriptions` table with columns: id, user_id, endpoint, p256dh_key, auth_key, created_at
- MUST add foreign key constraint to profiles table with ON DELETE CASCADE
- MUST create unique constraint on endpoint column
- MUST create indexes on user_id and endpoint columns
- MUST enable Row Level Security on the table
- MUST create RLS policies for: users read own, users insert own, users delete own, service role read all, service role delete all
- MUST follow migration naming convention: NNNN_descriptive_name.sql
- MUST be idempotent using IF NOT EXISTS and DROP IF EXISTS patterns
</requirements>

## Subtasks
- [x] 1.1 Create migration file with header comment describing purpose
- [x] 1.2 Define push_subscriptions table schema with all required columns
- [x] 1.3 Add foreign key constraint to profiles table
- [x] 1.4 Create indexes on user_id and endpoint columns
- [x] 1.5 Enable RLS and create all required policies
- [x] 1.6 Verify migration syntax and structure

## Implementation Details
Create a new migration file following the established pattern from previous migrations. The table must store Web Push subscription data including the endpoint URL and encryption keys (p256dh and auth). RLS policies must allow users to manage their own subscriptions while allowing the service role to read all subscriptions for sending notifications and delete invalid ones during cleanup.

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` — Reference for table creation pattern, RLS policy naming, and index naming
- `supabase/migrations/0007_leaderboard_tiebreakers.sql` — Most recent migration, shows current numbering

### Dependent Files
- `supabase/migrations/0008_notifications.sql` — File to be created

### Related ADRs
- [ADR-006: Auto-cleanup Invalid Push Subscriptions](../adrs/adr-006.md) — Service role delete policy enables cleanup of invalid subscriptions

## Deliverables
- Migration file `supabase/migrations/0008_notifications.sql` created
- Table schema matches TechSpec "Data Models" section
- All RLS policies created and verified
- SQL syntax validated

## Tests
- Unit tests:
  - [x] Migration file exists at correct path
  - [x] Table has all required columns with correct types
  - [x] Foreign key constraint references profiles(id) with CASCADE
  - [x] Unique constraint exists on endpoint column
  - [x] Indexes created on user_id and endpoint
  - [x] RLS enabled on table
  - [x] All 5 RLS policies created with correct names and conditions
- Integration tests:
  - [ ] Migration can be applied to test database without errors
  - [ ] User can insert their own subscription
  - [ ] User cannot read another user's subscription
  - [ ] Service role can read all subscriptions
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Migration file follows project naming convention
- SQL syntax is valid and idempotent
- RLS policies match TechSpec security requirements
