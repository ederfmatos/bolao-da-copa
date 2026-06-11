---
status: completed
title: "Service worker + vite.config.js injectManifest"
type: frontend
complexity: medium
dependencies: []
---

# Task 05: Service worker + vite.config.js injectManifest

## Overview
Create a custom service worker with push notification handlers and update the Vite PWA configuration to use injectManifest strategy. This enables the app to receive and display push notifications even when the app is not in the foreground, and handle notification clicks to navigate to relevant pages.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create src/service-worker.js with push event listener
- MUST create src/service-worker.js with notificationclick event listener
- MUST import and call precacheAndRoute from workbox-precaching
- MUST call skipWaiting() and clientsClaim() for immediate activation
- MUST display notifications with title, body, icon, and data from push payload
- MUST handle notificationclick to open the URL from notification data
- MUST update vite.config.js to use injectManifest strategy
- MUST configure srcDir and filename for custom service worker
- MUST preserve existing Workbox configuration for caching
- MUST use pwa-192x192.png as notification icon
</requirements>

## Subtasks
- [x] 5.1 Create src/service-worker.js file
- [x] 5.2 Import Workbox precacheAndRoute and call with self.__WB_MANIFEST
- [x] 5.3 Add skipWaiting() and clientsClaim() for immediate activation
- [x] 5.4 Implement push event listener to display notifications
- [x] 5.5 Implement notificationclick event listener to open URL
- [x] 5.6 Update vite.config.js to use injectManifest strategy
- [x] 5.7 Configure srcDir: 'src' and filename: 'service-worker.js'
- [x] 5.8 Preserve existing Workbox runtime caching configuration
- [x] 5.9 Test service worker registration and push handling

## Implementation Details
Create a custom service worker that handles push notifications. The service worker must use Workbox for precaching (injected by vite-plugin-pwa) and add custom event listeners for push and notificationclick events. The push listener must extract the notification payload (title, body, icon, data) and call `self.registration.showNotification()`. The notificationclick listener must close the notification and open the URL from the notification data using `clients.openWindow()`. Update vite.config.js to switch from generateSW to injectManifest strategy, specifying the custom service worker location.

### Relevant Files
- `vite.config.js` — Current PWA configuration to be modified
- `public/pwa-192x192.png` — Icon to use for notifications

### Dependent Files
- `src/service-worker.js` — File to be created
- `vite.config.js` — File to be modified
- `src/hooks/useNotifications.js` — Will register this service worker (task_06)

### Related ADRs
- [ADR-003: injectManifest Service Worker Strategy](../adrs/adr-003.md) — Decision to use injectManifest for full control over push events

## Deliverables
- Service worker file `src/service-worker.js` created
- Push event listener implemented
- Notificationclick event listener implemented
- vite.config.js updated to injectManifest strategy
- Existing Workbox caching preserved
- Notification icon configured
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Service worker file exists at src/service-worker.js
  - [x] precacheAndRoute is called with self.__WB_MANIFEST
  - [x] skipWaiting() is called
  - [x] clientsClaim() is called
  - [x] Push event listener is registered
  - [x] Push handler calls showNotification with correct parameters
  - [x] Notification data includes title, body, icon, and data fields
  - [x] Notificationclick event listener is registered
  - [x] Notificationclick handler closes the notification
  - [x] Notificationclick handler opens the URL from notification data
  - [x] vite.config.js uses injectManifest strategy
  - [x] vite.config.js specifies srcDir: 'src'
  - [x] vite.config.js specifies filename: 'service-worker.js'
  - [x] Existing Workbox runtime caching is preserved
- Integration tests:
  - [ ] Service worker registers successfully in browser
  - [ ] Push event triggers notification display
  - [ ] Notification click opens correct URL
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Service worker registers without errors
- Push notifications are displayed correctly
- Notification clicks navigate to correct page
- Existing offline caching continues to work
