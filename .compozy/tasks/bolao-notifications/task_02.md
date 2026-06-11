---
status: completed
title: "Shared push helper (_shared/sendPush.ts)"
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 02: Shared push helper (_shared/sendPush.ts)

## Overview
Create a reusable helper function for sending Web Push notifications using deno-web-push library. This shared module will be imported by multiple edge functions (send-notifications, sync-matches) to avoid code duplication and ensure consistent push sending behavior.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST use deno-web-push library from https://deno.land/x/deno_web_push
- MUST export a sendPush function that accepts subscription data and notification payload
- MUST read VAPID keys from environment variables (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
- MUST set VAPID subject to mailto: URL from environment variable (VAPID_SUBJECT)
- MUST return success/failure status with error details
- MUST handle 410 Gone responses and return indicator for subscription cleanup
- MUST follow TypeScript conventions from existing _shared/calculatePoints.ts
- MUST include proper error handling and logging
</requirements>

## Subtasks
- [x] 2.1 Create _shared/sendPush.ts file with proper imports
- [x] 2.2 Define TypeScript interfaces for PushSubscription and NotificationPayload
- [x] 2.3 Implement sendPush function with VAPID authentication
- [x] 2.4 Add error handling for network failures and 410 responses
- [x] 2.5 Add logging for successful sends and failures
- [x] 2.6 Export function and types for use by other edge functions

## Implementation Details
Create a shared helper following the pattern established by `_shared/calculatePoints.ts`. The function must accept a push subscription object (with endpoint, p256dh_key, auth_key) and a notification payload (title, body, data). It must use deno-web-push to send the notification with VAPID authentication. The function should return a result object indicating success, failure, or expired subscription (410 Gone) to enable auto-cleanup.

### Relevant Files
- `supabase/functions/_shared/calculatePoints.ts` — Reference for shared helper pattern, TypeScript conventions, and export style
- `supabase/functions/sync-matches/index.ts` — Shows how shared code is imported and used

### Dependent Files
- `supabase/functions/_shared/sendPush.ts` — File to be created
- `supabase/functions/send-notifications/index.ts` — Will import this helper (task_04)
- `supabase/functions/sync-matches/index.ts` — Will import this helper (task_09)

### Related ADRs
- [ADR-002: deno-web-push Library](../adrs/adr-002.md) — Decision to use deno-web-push for Web Push protocol
- [ADR-006: Auto-cleanup Invalid Push Subscriptions](../adrs/adr-006.md) — 410 response handling enables auto-cleanup

## Deliverables
- Shared helper file `supabase/functions/_shared/sendPush.ts` created
- TypeScript interfaces exported for PushSubscription and NotificationPayload
- sendPush function implemented with VAPID authentication
- Error handling for network failures and 410 responses
- Logging for debugging and monitoring
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] sendPush function accepts valid subscription and payload
  - [x] VAPID keys read from environment variables
  - [x] Successful send returns { success: true, expired: false }
  - [x] Network error returns { success: false, error: "..." }
  - [x] 410 Gone response returns { success: false, expired: true }
  - [x] Missing VAPID keys throw descriptive error
  - [x] Invalid subscription format throws error
- Integration tests:
  - [x] Function can be imported by other edge functions
  - [x] TypeScript types are correctly exported
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Function follows project TypeScript conventions
- Error handling covers all failure modes
- Logging provides sufficient debugging information
