---
status: completed
title: "Modify sync-matches for post-match trigger"
type: backend
complexity: medium
dependencies:
  - task_04
---

# Task 09: Modify sync-matches for post-match trigger

## Overview
Modify the existing sync-matches edge function to trigger post-match notifications after calculating points for newly finished matches. This integration ensures that users receive timely notifications about their prediction results immediately after a match ends.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST modify supabase/functions/sync-matches/index.ts
- MUST detect newly finished matches (already implemented)
- MUST call send-notifications edge function after calculating points for each newly finished match
- MUST pass match data (id, home_team, away_team, home_score, away_score) to send-notifications
- MUST pass notification type as 'post-match'
- MUST use service role key for authentication when calling send-notifications
- MUST handle send-notifications failures gracefully (log error, don't fail sync)
- MUST not block sync-matches response on notification sending
- MUST preserve existing sync-matches functionality
- MUST follow error handling pattern from existing code
</requirements>

## Subtasks
- [x] 9.1 Read existing sync-matches/index.ts to understand current flow
- [x] 9.2 Identify where newly finished matches are processed
- [x] 9.3 Add call to send-notifications after points calculation
- [x] 9.4 Format request payload with match data and type 'post-match'
- [x] 9.5 Use service role key for authentication
- [x] 9.6 Add error handling for notification sending failures
- [x] 9.7 Ensure notification sending doesn't block sync response
- [x] 9.8 Add logging for notification sending attempts
- [x] 9.9 Test integration with existing sync flow

## Implementation Details
Modify the existing `sync-matches/index.ts` edge function to trigger post-match notifications. After the function detects newly finished matches and calculates points for predictions, it must call the `send-notifications` edge function with the match data. The call must be non-blocking (fire-and-forget or awaited but with error handling that doesn't fail the sync). The request must include the match ID, teams, scores, and notification type 'post-match'. Use the service role key for authentication when calling send-notifications.

### Relevant Files
- `supabase/functions/sync-matches/index.ts` — File to be modified
- `supabase/functions/send-notifications/index.ts` — Function to call (task_04)
- `supabase/functions/_shared/calculatePoints.ts` — Points calculation (already used)

### Dependent Files
- `supabase/functions/sync-matches/index.ts` — File to be modified
- Cron job for sync-matches — Will now also trigger notifications

### Related ADRs
- [ADR-004: Single Edge Function for Notifications](../adrs/adr-004.md) — send-notifications is called by sync-matches

## Deliverables
- Modified `supabase/functions/sync-matches/index.ts` file
- Post-match notification trigger integrated
- Error handling for notification failures
- Non-blocking notification sending
- Logging for debugging
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Newly finished match triggers notification call
  - [x] Notification call includes correct match data
  - [x] Notification call uses type 'post-match'
  - [x] Notification call uses service role key
  - [x] Notification failure is logged but doesn't fail sync
  - [x] Multiple newly finished matches trigger multiple notifications
  - [x] No newly finished matches means no notification calls
  - [x] Existing sync functionality is preserved
  - [x] Points calculation still works correctly
- Integration tests:
  - [x] Sync-matches function can be deployed with modifications
  - [x] Post-match notifications are sent after sync
  - [x] Sync response is not blocked by notification sending
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Post-match notifications are triggered correctly
- Existing sync functionality is not broken
- Error handling prevents notification failures from breaking sync
- Logging provides sufficient debugging information
