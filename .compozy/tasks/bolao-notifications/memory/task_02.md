# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Implement shared push helper `_shared/sendPush.ts` with VAPID auth, error handling (410 detection), logging, and unit tests.

## Important Decisions

- **Library substitution**: `deno_web_push` from `deno.land/x` no longer exists (404). Used `@negrel/webpush@0.5.0` from JSR instead — Deno-native, RFC 8291/8292 compliant, VAPID support.
- **Adapter pattern**: Created `webPushLib.ts` as a thin re-export layer so vitest can mock the JSR import (vitest can't resolve `jsr:` protocol directly).
- **VAPID key format**: Env vars store base64url-encoded raw EC keys. The library expects JWK format. Implemented conversion in `vapidKeysToJwk()`.
- **Error propagation**: Missing VAPID env vars throw (not caught) — matches task spec. Push failures (network, non-410) return `{ success: false }`. 410 returns `{ expired: true }`.
- **Server caching**: `ApplicationServer` instance is cached in module state to avoid re-importing VAPID keys on every call. `resetServerCache()` exported for testing.

## Learnings

- vitest v4 cannot resolve `jsr:` imports even with `vi.mock()`. Workaround: local adapter file that re-exports from JSR, then mock the adapter.
- `@negrel/webpush` `PushMessageError` has `.isGone()` for 410 detection and `.response` for accessing the raw Response.
- VAPID public key is 65 bytes (0x04 prefix + 32 bytes x + 32 bytes y). Private key is 32 bytes.

## Files / Surfaces

- `supabase/functions/_shared/sendPush.ts` — Created (main helper)
- `supabase/functions/_shared/webPushLib.ts` — Created (JSR adapter for testability)
- `supabase/functions/_shared/__tests__/sendPush.test.ts` — Created (20 tests)

## Errors / Corrections

- Initial test approach tried to mock `jsr:@negrel/webpush@0.5.0` directly — vitest couldn't resolve the protocol. Fixed by creating `webPushLib.ts` adapter.
- VAPID missing-key errors were caught by try/catch and returned as results instead of thrown. Fixed by re-throwing errors matching "environment variable is not set".

## Ready for Next Run

- Task 04 (send-notifications edge function) will import `sendPush` from this helper
- Task 09 (sync-matches modification) will also import this helper
