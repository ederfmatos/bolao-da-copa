# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Create custom service worker with push notification handlers and update Vite PWA configuration to use injectManifest strategy.

## Important Decisions

- Used `vi.resetModules()` and `vi.doMock()` pattern for service worker tests since SW runs in a different context with `self` global
- vite.config.js tests read file as text and check for string patterns rather than importing (Vite config uses Vite-specific APIs that can't be imported in test context)
- Added null check for `event.data` in push handler to prevent errors on empty push events
- Added null check for `event.notification.data?.url` in notificationclick handler

## Learnings

- Service worker tests require mocking `globalThis.self` with `__WB_MANIFEST`, `registration.showNotification`, and `addEventListener`
- Service worker tests require mocking `globalThis.clients` with `openWindow`
- Workbox modules (`workbox-precaching`, `workbox-core`) must be mocked before importing the service worker

## Files / Surfaces

- `src/service-worker.js` — Created with push + notificationclick handlers
- `vite.config.js` — Modified to add injectManifest strategy, srcDir, filename
- `src/__tests__/service-worker.test.js` — Created with 11 tests
- `src/__tests__/vite-config.test.js` — Created with 6 tests

## Errors / Corrections

- Initial test attempt failed because module caching prevented mocks from being applied — fixed with `vi.resetModules()` + `vi.doMock()`
- Initial vite.config test tried to import the config file which failed due to Vite-specific APIs — fixed by reading file as text

## Ready for Next Run

Task 05 complete. Task 06 (useNotifications hook) is now unblocked and can reference this service worker for registration.
