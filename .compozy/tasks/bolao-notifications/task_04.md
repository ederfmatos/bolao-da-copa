---
status: completed
title: "Send notifications edge function"
type: backend
complexity: high
dependencies:
  - task_02
  - task_03
---

# Task 04: Send notifications edge function

## Overview
Create the main edge function for sending push notifications to all subscribed users. This function handles all three notification types (daily-digest, post-match, deadline-reminder) and is invoked by cron jobs and other edge functions. It queries active subscriptions, formats personalized payloads, sends push notifications, and performs auto-cleanup of invalid subscriptions.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create edge function at supabase/functions/send-notifications/index.ts
- MUST accept POST requests with notification type and data payload
- MUST authenticate via service role key (internal use only, not user-facing)
- MUST support three notification types: daily-digest, post-match, deadline-reminder
- MUST query push_subscriptions table for active subscriptions
- MUST format personalized payloads based on notification type and user data
- MUST use sendPush helper from _shared/sendPush.ts (task_02)
- MUST handle 410 Gone responses and delete invalid subscriptions from database
- MUST return summary of sent, failed, and cleaned subscriptions
- MUST follow edge function pattern from sync-matches
- MUST include comprehensive logging for monitoring
</requirements>

## Subtasks
- [x] 4.1 Create send-notifications directory and index.ts file
- [x] 4.2 Implement POST handler with type-based routing
- [x] 4.3 Add service role authentication
- [x] 4.4 Implement daily-digest notification logic (query today's matches, format payload)
- [x] 4.5 Implement post-match notification logic (query predictions for match, personalize per user)
- [x] 4.6 Implement deadline-reminder logic (query matches starting in 2h, filter users without predictions)
- [x] 4.7 Integrate sendPush helper for sending notifications
- [x] 4.8 Implement auto-cleanup of invalid subscriptions (410 responses)
- [x] 4.9 Add summary response with sent/failed/cleaned counts
- [x] 4.10 Add comprehensive logging and error handling

## Implementation Details
Create the main notification-sending edge function. This function is internal (service role only) and is called by cron jobs for daily-digest and deadline-reminder, and by sync-matches for post-match notifications. The function must:
1. Accept a request with `type` and `data` fields
2. Query all active push subscriptions
3. For each subscription, determine if the user should receive this notification (e.g., only users who predicted for post-match)
4. Format a personalized payload for each user
5. Send the push notification using the sendPush helper
6. Collect results and perform auto-cleanup for expired subscriptions
7. Return a summary of the operation

### Relevant Files
- `supabase/functions/sync-matches/index.ts` — Reference for edge function structure
- `supabase/functions/_shared/sendPush.ts` — Push sending helper (task_02)
- `supabase/functions/_shared/calculatePoints.ts` — May need to query predictions with points
- `supabase/migrations/0008_notifications.sql` — push_subscriptions table schema (task_01)

### Dependent Files
- `supabase/functions/send-notifications/index.ts` — File to be created
- `supabase/functions/sync-matches/index.ts` — Will call this function (task_09)
- Cron jobs — Will call this function (task_10)

### Related ADRs
- [ADR-004: Single Edge Function for Notifications](../adrs/adr-004.md) — Decision to use single function for all notification types
- [ADR-005: Fixed Brasília Timezone](../adrs/adr-005.md) — Timezone handling for daily-digest and deadline-reminder
- [ADR-006: Auto-cleanup Invalid Push Subscriptions](../adrs/adr-006.md) — Auto-cleanup implementation

## Deliverables
- Edge function file `supabase/functions/send-notifications/index.ts` created
- All three notification types implemented
- Service role authentication enforced
- Personalized payload formatting for each type
- Auto-cleanup of invalid subscriptions
- Summary response with operation metrics
- Comprehensive logging
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] POST with daily-digest type queries today's matches
  - [x] POST with post-match type queries predictions for specific match
  - [x] POST with deadline-reminder type queries matches starting in 2h
  - [x] Service role authentication is enforced (rejects user JWT)
  - [x] Missing type field returns 400
  - [x] Invalid notification type returns 400
  - [x] No active subscriptions returns success with sent=0
  - [x] 410 responses trigger subscription deletion
  - [x] Network errors are logged and counted as failures
  - [x] Response includes accurate sent/failed/cleaned counts
  - [x] Daily digest skips days with no matches
  - [x] Post-match only notifies users who predicted
  - [x] Deadline reminder only notifies users without predictions
- Integration tests:
  - [x] Function can be invoked via HTTP POST
  - [x] Notifications are sent to all active subscriptions
  - [x] Invalid subscriptions are cleaned up
  - [x] Database state is updated correctly after cleanup
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All three notification types work correctly
- Auto-cleanup removes invalid subscriptions
- Logging provides sufficient monitoring data
- Function handles edge cases (no subscriptions, no matches, network failures)
