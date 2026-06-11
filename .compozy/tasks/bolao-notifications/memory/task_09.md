# Task Memory: task_09.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Modify sync-matches edge function to trigger post-match notifications after calculating points for newly finished matches.

## Important Decisions

- Extracted `handleSyncMatches` as exported function for testability (matching send-notifications pattern)
- Created local adapter files (`serve.ts`, `supabaseClient.ts`) to enable vitest mocking of Deno URL imports
- `triggerPostMatchNotification` is fire-and-forget (called without `await`) to keep sync non-blocking
- Error handling inside `triggerPostMatchNotification` catches all errors and logs them without throwing

## Learnings

- sync-matches used direct URL imports (`https://deno.land/...`, `https://esm.sh/...`) unlike send-notifications which had local adapter files
- vitest cannot mock URL imports directly; local adapter files are required

## Files / Surfaces

- `supabase/functions/sync-matches/index.ts` — Modified: added `triggerPostMatchNotification`, exported `handleSyncMatches`
- `supabase/functions/sync-matches/serve.ts` — New: adapter for Deno serve import
- `supabase/functions/sync-matches/supabaseClient.ts` — New: adapter for supabase-js import
- `supabase/functions/sync-matches/__tests__/index.test.ts` — New: 15 unit tests

## Errors / Corrections

None.

## Ready for Next Run

Task 09 is complete. All 15 tests pass. Full suite (462 tests) passes.
