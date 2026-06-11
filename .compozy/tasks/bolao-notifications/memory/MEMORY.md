# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- Task 01 (migration 0008) is complete
- Task 02 (sendPush helper) is complete
- Task 03 (register/unregister edge function) is complete
- Task 04 (send-notifications edge function) is complete
- Task 05 (service worker + injectManifest) is complete
- Task 06 (useNotifications hook) is complete
- Task 07 (NotificationPrompt + App.jsx integration) is complete
- Task 08 (NotificationToggle + Profile integration) is complete
- Task 09 (sync-matches post-match trigger, depends on 04) is complete
- Task 10 (cron jobs, depends on 04) is complete
- All tasks in the PRD are now completed

## Shared Decisions

- SQL migration tests live at `supabase/migrations/__tests__/` using vitest structural validation
- Migration naming: `NNNN_descriptive_name.sql`, section separators with `====`, `DROP POLICY IF EXISTS` + `CREATE POLICY` for idempotency

## Shared Learnings

- ESLint config is broken (pre-existing) — `eslint.config.js` missing, eslint v10 requires flat config
- No live Supabase test instance available; integration tests requiring DB apply are deferred
- `deno_web_push` from `deno.land/x` no longer exists (404). Using `@negrel/webpush@0.5.0` from JSR instead
- vitest can't resolve `jsr:` imports — use a local adapter file (`webPushLib.ts`) that re-exports from JSR, then mock the adapter in tests
- Service worker tests require `vi.resetModules()` + `vi.doMock()` pattern and mocking `globalThis.self`/`globalThis.clients`
- vite.config.js tests should read file as text (not import) since Vite config uses Vite-specific APIs
- Hooks using `useAuth` must mock it with a stable `user` reference (via `vi.hoisted`), otherwise `useEffect` deps re-trigger on every render and overwrite state
- `waitFor` + `vi.useFakeTimers()` causes test timeouts in component tests; use `act(async () => ...)` with `mockResolvedValue` instead
- Edge functions with direct URL imports (`https://deno.land/...`, `https://esm.sh/...`) need local adapter files (`serve.ts`, `supabaseClient.ts`) for vitest mocking
- `cron.schedule()` accepts timezone as 4th parameter: `cron.schedule(name, schedule, command, timezone)` — used for America/Sao_Paulo in notification cron jobs
- Idempotent cron migration pattern: wrap `cron.unschedule()` in `DO $$ BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END $$` blocks before `cron.schedule()`

## Open Risks

- Integration tests for migration (apply to DB, test RLS behavior) require a live Supabase instance and are not yet automated

## Handoffs

- Task 04 (send-notifications) depends on task_02 (sendPush) + task_03 (register-subscription) — both complete
- Task 06 (useNotifications hook) depends on task_03 — complete
- Task 07 (NotificationPrompt) depends on task_06 — complete
- Task 08 (NotificationToggle) depends on task_06 — complete
- Task 09 (sync-matches post-match trigger) depends on task_04 — now complete
- Task 10 (cron jobs) depends on task_04 — now complete
- All PRD tasks completed
