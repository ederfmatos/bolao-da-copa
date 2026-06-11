# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Create send-notifications edge function supporting daily-digest, post-match, and deadline-reminder notification types with service role auth, auto-cleanup, and personalized payloads.

## Important Decisions

- Exported `handleSendNotifications` function for testability (following register-subscription pattern)
- Service role auth compares token directly against `SUPABASE_SERVICE_ROLE_KEY` env var
- daily-digest queries matches by Brasília timezone date range (UTC-3)
- post-match receives match data in request body (from sync-matches caller)
- deadline-reminder queries matches in next 2h window, cross-references predictions to find users without picks
- Auto-cleanup deletes expired subscriptions via batch `.in('id', expiredIds)` after all sends complete
- Used nested mock chains in tests (select→eq→resolved) instead of shared `setupSupabaseChain` helper

## Learnings

- vitest mocks for Supabase chains need careful ordering: `mockReturnValue` after `mockResolvedValue` will override it
- The `sendToSubscriptions` helper pattern works well for daily-digest and post-match but deadline-reminder needed its own loop due to per-subscription payload differences

## Files / Surfaces

- `supabase/functions/send-notifications/index.ts` — Main edge function (created)
- `supabase/functions/send-notifications/serve.ts` — Serve adapter (created)
- `supabase/functions/send-notifications/supabaseClient.ts` — Supabase client adapter (created)
- `supabase/functions/send-notifications/__tests__/index.test.ts` — Unit tests (created, 22 tests)

## Errors / Corrections

- Initial test mocks used `mockReturnThis()` + `mockResolvedValue()` on same method — second call was overridden by subsequent `mockReturnValue()`. Fixed by using nested object chains instead.

## Ready for Next Run

Task 04 is complete. Task 09 (modify sync-matches for post-match trigger) and Task 10 (cron jobs) are now unblocked.
