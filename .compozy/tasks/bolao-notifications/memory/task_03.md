# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Create register-subscription edge function with POST (register) and DELETE (unregister) handlers, JWT auth, validation, upsert, and proper HTTP status codes.

## Important Decisions

- Created local adapters (`serve.ts`, `supabaseClient.ts`) for URL imports to enable vitest mocking, following the `webPushLib.ts` pattern from task_02
- Auth uses anon key for JWT verification, service role key for DB operations (RLS bypass)
- Upsert strategy: check-then-insert-or-update (not SQL ON CONFLICT) to return correct status codes (201 vs 200)
- `handleRegisterSubscription` exported separately from `serve()` call for testability

## Learnings

- Supabase `getUser()` returns `{ data: { user }, error }` — mock must match this shape
- vitest can't resolve `https://` URL imports; local adapter files are required for mocking
- Edge function tests need `vi.stubGlobal('Deno', fakeDeno)` for env vars and `vi.mock()` for adapters

## Files / Surfaces

- `supabase/functions/register-subscription/index.ts` — main edge function (created)
- `supabase/functions/register-subscription/serve.ts` — serve adapter (created)
- `supabase/functions/register-subscription/supabaseClient.ts` — supabase client adapter (created)
- `supabase/functions/register-subscription/__tests__/index.test.ts` — 20 unit tests (created)

## Errors / Corrections

- Initial mock for `getUser` returned `{ user, error }` instead of `{ data: { user }, error }` — fixed to match Supabase client response shape

## Ready for Next Run

Task 03 is complete. Task 04 (send-notifications) and task 06 (useNotifications hook) are now unblocked.
