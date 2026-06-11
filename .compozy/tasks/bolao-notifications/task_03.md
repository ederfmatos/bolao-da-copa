---
status: completed
title: "Register/unregister subscription edge function"
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 03: Register/unregister subscription edge function

## Overview
Create an edge function that handles push subscription registration and unregistration. This function allows authenticated users to save their push subscriptions to the database after granting browser permission, and to remove them when disabling notifications.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create edge function at supabase/functions/register-subscription/index.ts
- MUST accept POST requests with subscription data (endpoint, keys.p256dh, keys.auth)
- MUST authenticate user via JWT token in Authorization header
- MUST validate subscription data format before insertion
- MUST handle duplicate endpoint gracefully (upsert or return existing)
- MUST support DELETE method to unregister subscription by endpoint
- MUST follow edge function pattern from sync-matches (serve(), error handling, JSON responses)
- MUST return appropriate HTTP status codes (201 for create, 200 for delete, 400 for validation, 401 for auth, 500 for errors)
</requirements>

## Subtasks
- [x] 3.1 Create register-subscription directory and index.ts file
- [x] 3.2 Implement POST handler for subscription registration
- [x] 3.3 Add user authentication via JWT token verification
- [x] 3.4 Add subscription data validation
- [x] 3.5 Implement duplicate endpoint handling (upsert)
- [x] 3.6 Implement DELETE handler for unregistration
- [x] 3.7 Add error handling and proper HTTP status codes
- [x] 3.8 Add logging for debugging

## Implementation Details
Create a new edge function following the pattern from `sync-matches/index.ts`. The function must handle two HTTP methods: POST for registering a new subscription and DELETE for unregistering. For POST, it must validate the subscription data, verify the user is authenticated, and insert the subscription into the `push_subscriptions` table. If the endpoint already exists, it should update the keys (upsert). For DELETE, it must find and remove the subscription by endpoint for the authenticated user.

### Relevant Files
- `supabase/functions/sync-matches/index.ts` — Reference for edge function structure, serve() pattern, error handling, and JSON responses
- `supabase/migrations/0008_notifications.sql` — Table schema for push_subscriptions (created in task_01)

### Dependent Files
- `supabase/functions/register-subscription/index.ts` — File to be created
- `src/hooks/useNotifications.js` — Will call this endpoint (task_06)

### Related ADRs
- [ADR-004: Single Edge Function for Notifications](../adrs/adr-004.md) — This is a separate function for user-facing subscription management, distinct from the internal send-notifications function

## Deliverables
- Edge function file `supabase/functions/register-subscription/index.ts` created
- POST handler for subscription registration implemented
- DELETE handler for unregistration implemented
- User authentication via JWT
- Subscription data validation
- Proper HTTP status codes and error responses
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] POST with valid subscription returns 201 with subscription_id
  - [x] POST with duplicate endpoint upserts and returns 200
  - [x] POST with missing fields returns 400 with validation error
  - [x] POST without auth token returns 401
  - [x] POST with invalid JWT returns 401
  - [x] DELETE with valid endpoint returns 200
  - [x] DELETE with non-existent endpoint returns 404
  - [x] DELETE without auth token returns 401
  - [x] Non-POST/DELETE methods return 405
  - [x] Database errors return 500 with error message
- Integration tests:
  - [ ] Function can be deployed and invoked
  - [ ] Subscription is saved to database correctly
  - [ ] User can only manage their own subscriptions
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Function follows project edge function conventions
- Authentication is properly enforced
- Error handling covers all failure modes
- HTTP status codes are semantically correct
