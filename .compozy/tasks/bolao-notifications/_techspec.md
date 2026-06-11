# TechSpec: Bolão Notifications

## Executive Summary

Sistema de notificações push para o Bolão Copa 2026 usando Web Push API com VAPID authentication. A arquitetura consiste em: (1) service worker customizado via injectManifest para receber e exibir notificações, (2) edge function `send-notifications` para enviar push via deno-web-push, (3) cron jobs para agendamento de daily digest e deadline reminders, e (4) frontend com hooks para gerenciar permissões e subscriptions.

**Primary trade-off:** Complexidade inicial maior (3 tipos de notificação + infraestrutura completa) em troca de entrega de valor imediato e experiência completa desde o MVP.

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  useNotifications ──── NotificationPrompt ──── ProfileToggle   │
│         │                      │                      │         │
│         └──────────────────────┴──────────────────────┘         │
│                            │                                     │
│                    service-worker.js                             │
│                    (push + notificationclick)                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Push API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEB PUSH SERVICE                              │
│              (Firebase Cloud Messaging / Mozilla)                │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTP POST (VAPID signed)
                            │
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTIONS                        │
├─────────────────────────────────────────────────────────────────┤
│  send-notifications ──── _shared/sendPush.ts                    │
│         │                                                        │
│         └─── push_subscriptions table                            │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ pg_net
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      pg_cron JOBS                                │
├─────────────────────────────────────────────────────────────────┤
│  daily-digest-8am ──── deadline-reminders-15min                 │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ Trigger
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    sync-matches (existing)                       │
│              (detects newlyFinished matches)                     │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow:**

1. **Opt-in flow**: User clicks "Enable notifications" → `Notification.requestPermission()` → `PushManager.subscribe()` → POST subscription to `/functions/v1/register-subscription` → stored in `push_subscriptions` table

2. **Daily digest flow**: Cron job (08:00) → `net.http_post()` to `/functions/v1/send-notifications` with `type: 'daily-digest'` → edge function queries today's matches → sends push to all active subscriptions

3. **Post-match flow**: `sync-matches` detects `newlyFinished` match → calls `send-notifications` with `type: 'post-match'` and match data → edge function queries predictions for that match → sends personalized push to each user who predicted

4. **Deadline reminder flow**: Cron job (every 15min) → `net.http_post()` to `/functions/v1/send-notifications` with `type: 'deadline-reminder'` → edge function queries matches starting in 2h with no predictions from subscribed users → sends reminder push

## Implementation Design

### Core Interfaces

**Notification Types:**

```typescript
type NotificationType = 'daily-digest' | 'post-match' | 'deadline-reminder';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data: {
    url: string;
    matchId?: string;
  };
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: string;
}
```

**Edge Function Request/Response:**

```typescript
// POST /functions/v1/send-notifications
interface SendNotificationsRequest {
  type: NotificationType;
  data: {
    matchId?: string;
    match?: { home_team: string; away_team: string; home_score: number; away_score: number };
    matches?: Array<{ home_team: string; away_team: string; kickoff_at: string }>;
    points?: number;
    prediction?: { home_score: number; away_score: number };
  };
}

interface SendNotificationsResponse {
  success: boolean;
  sent: number;
  failed: number;
  cleaned: number;
}
```

**Service Worker Push Event:**

```typescript
// src/service-worker.js
self.addEventListener('push', (event: PushEvent) => {
  const payload: NotificationPayload = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data,
    })
  );
});
```

### Data Models

**New Table: push_subscriptions**

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

**RLS Policies:**

```sql
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "push_subscriptions_read_own" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can read all (for sending notifications)
CREATE POLICY "push_subscriptions_service_read_all" ON push_subscriptions
  FOR SELECT USING (auth.role() = 'service_role');

-- Service role can delete (for cleanup)
CREATE POLICY "push_subscriptions_service_delete_all" ON push_subscriptions
  FOR DELETE USING (auth.role() = 'service_role');
```

### API Endpoints

**1. Register Push Subscription**

```
POST /functions/v1/register-subscription
Authorization: Bearer <user-jwt>

Request:
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}

Response (201):
{
  "success": true,
  "subscription_id": "uuid"
}
```

**2. Send Notifications (internal)**

```
POST /functions/v1/send-notifications
Authorization: Bearer <service-role-key>

Request:
{
  "type": "daily-digest",
  "data": {
    "matches": [
      { "home_team": "Brazil", "away_team": "Germany", "kickoff_at": "2026-06-15T11:00:00Z" }
    ]
  }
}

Response (200):
{
  "success": true,
  "sent": 42,
  "failed": 0,
  "cleaned": 2
}
```

**3. Unregister Push Subscription**

```
DELETE /functions/v1/unregister-subscription
Authorization: Bearer <user-jwt>

Request:
{
  "endpoint": "https://fcm.googleapis.com/..."
}

Response (200):
{
  "success": true
}
```

## Integration Points

### Web Push Protocol (External)

- **Service**: Firebase Cloud Messaging (Chrome), Mozilla Push Service (Firefox), Apple Push Notification Service (Safari)
- **Authentication**: VAPID (Voluntary Application Server Identification)
- **Error handling**: Retry on 429 (rate limit), cleanup on 410 (gone)

### Supabase Realtime (Internal)

- **Table**: `push_subscriptions` (enable Realtime publication)
- **Purpose**: Notify frontend when subscription is registered/deleted
- **Auth**: Use existing Supabase Realtime infrastructure

### pg_cron + pg_net (Internal)

- **Jobs**: 
  - `daily-digest-8am`: Runs at 08:00 America/Sao_Paulo
  - `deadline-reminders-15min`: Runs every 15 minutes
- **Pattern**: Follow existing `sync-matches-every-5-min` job

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `vite.config.js` | Modified | Change PWA strategy from generateSW to injectManifest | Update VitePWA config, add srcDir and filename |
| `src/service-worker.js` | New | Custom service worker with push event handlers | Create file with push + notificationclick listeners |
| `src/hooks/useNotifications.js` | New | Hook for managing notification permissions and subscriptions | Create hook following existing pattern |
| `src/components/NotificationPrompt.jsx` | New | Banner component for first-time opt-in | Create component with explanatory text + CTA |
| `src/components/NotificationToggle.jsx` | New | Toggle component for profile page | Create component with switch UI |
| `supabase/migrations/0008_notifications.sql` | New | Migration for push_subscriptions table + RLS | Create migration file |
| `supabase/functions/send-notifications/` | New | Edge function for sending push notifications | Create function with deno-web-push |
| `supabase/functions/register-subscription/` | New | Edge function for registering subscriptions | Create function to save subscription to DB |
| `supabase/functions/_shared/sendPush.ts` | New | Shared helper for sending push notifications | Create reusable push sending logic |
| `sync-matches/index.ts` | Modified | Add trigger for post-match notifications | Call send-notifications after calculating points |
| `.env.example` | Modified | Add VITE_VAPID_PUBLIC_KEY | Document new env var |

## Testing Approach

### Unit Tests

**Frontend:**
- `useNotifications.test.js`: Test permission request, subscription registration, error handling
- `NotificationPrompt.test.jsx`: Test banner display, CTA click, dismiss behavior
- `NotificationToggle.test.jsx`: Test toggle state, API calls, loading states

**Edge Functions:**
- `send-notifications.test.ts`: Test payload formatting, subscription querying, error handling
- `sendPush.test.ts`: Test VAPID signing, HTTP request formatting, retry logic
- `register-subscription.test.ts`: Test subscription validation, DB insertion, duplicate handling

**Service Worker:**
- Mock `PushEvent` and test notification display
- Mock `NotificationClickEvent` and test navigation

### Integration Tests

**End-to-end opt-in flow:**
1. User clicks "Enable notifications"
2. Browser permission dialog appears
3. User grants permission
4. Subscription is saved to `push_subscriptions`
5. Toggle in profile shows "enabled"

**End-to-end notification flow:**
1. Cron job triggers `send-notifications`
2. Edge function queries subscriptions
3. Push is sent to each subscription
4. Service worker receives push event
5. Notification is displayed
6. User clicks notification
7. App opens to correct page

**Test data requirements:**
- Mock VAPID keys (test/public)
- Sample push subscriptions (valid + invalid)
- Sample matches and predictions

**Environment dependencies:**
- Supabase local instance or test project
- Deno runtime for edge functions
- Browser with push support (Chrome/Firefox)

## Development Sequencing

### Build Order

1. **Migration 0008** - Create `push_subscriptions` table + RLS policies (no dependencies)

2. **Generate VAPID keys** - Generate public/private key pair using `web-push` CLI or online tool (no dependencies)

3. **Shared push helper** - Create `_shared/sendPush.ts` with deno-web-push integration (depends on step 2)

4. **Register subscription edge function** - Create `/functions/v1/register-subscription` to save subscriptions (depends on step 1)

5. **Send notifications edge function** - Create `/functions/v1/send-notifications` with all 3 notification types (depends on steps 1, 3)

6. **Service worker** - Create `src/service-worker.js` with push + notificationclick handlers (no dependencies)

7. **Update vite.config.js** - Change PWA strategy to injectManifest (depends on step 6)

8. **useNotifications hook** - Create hook for permission request + subscription management (depends on steps 4, 5)

9. **NotificationPrompt component** - Create banner for first-time opt-in (depends on step 8)

10. **NotificationToggle component** - Create toggle for profile page (depends on step 8)

11. **Integrate NotificationPrompt** - Add to App.jsx after login (depends on step 9)

12. **Integrate NotificationToggle** - Add to Profile page (depends on step 10)

13. **Modify sync-matches** - Add post-match notification trigger (depends on step 5)

14. **Create cron jobs** - Add daily-digest and deadline-reminder schedules (depends on step 5)

15. **End-to-end testing** - Test all 3 notification types in production-like environment (depends on all previous steps)

### Technical Dependencies

**Infrastructure:**
- VAPID key pair (generate before development)
- Supabase project with pg_cron + pg_net enabled (already configured)
- Deno runtime for edge functions (already configured)

**External services:**
- Web Push service (Firebase, Mozilla, Apple) - provided by browser vendors
- No additional API keys required beyond VAPID

**Team deliverables:**
- None (all self-contained)

## Monitoring and Observability

### Key Metrics

- **Opt-in rate**: % of users who enable notifications (target: 60%)
- **Delivery rate**: % of notifications successfully delivered (target: 95%)
- **Latency**: Time from event to notification delivery (target: < 2min for post-match)
- **CTR**: % of notifications clicked (target: 20%)
- **Cleanup rate**: Number of invalid subscriptions removed per day

### Log Events

**Edge Function (send-notifications):**
```typescript
console.log(JSON.stringify({
  event: 'notification_sent',
  type: 'daily-digest',
  recipient_count: 42,
  success_count: 40,
  failure_count: 2,
  cleaned_subscriptions: 1,
  timestamp: new Date().toISOString(),
}));
```

**Service Worker:**
```javascript
console.log('[SW] Push received:', event.data.json());
console.log('[SW] Notification clicked:', event.notification.data);
```

### Alerting Thresholds

- **Delivery rate < 90%**: Investigate VAPID keys or push service issues
- **Latency > 5min**: Check edge function performance or cron job delays
- **Cleanup rate > 10/day**: Possible subscription invalidation bug
- **Opt-in rate < 30%**: Review prompt UX and value proposition

## Technical Considerations

### Key Decisions

**Decision 1: deno-web-push library**
- **Rationale**: Native Deno library, no npm dependencies, VAPID support
- **Trade-offs**: Less mature than npm web-push, smaller community
- **Alternatives rejected**: Manual VAPID implementation (too complex), web-push via esm.sh (npm in Deno)

**Decision 2: injectManifest service worker**
- **Rationale**: Full control over push events, industry standard for PWAs
- **Trade-offs**: More complex setup than generateSW
- **Alternatives rejected**: generateSW + extensions (less flexibility)

**Decision 3: Single edge function**
- **Rationale**: Code reuse, simpler maintenance, consistent with sync-matches pattern
- **Trade-offs**: Larger function, single point of failure
- **Alternatives rejected**: Separate functions per type (over-engineering)

**Decision 4: Fixed Brasília timezone**
- **Rationale**: Simplicity, Brazilian audience, no international users known
- **Trade-offs**: Users in other timezones get notifications at different local times
- **Alternatives rejected**: Per-user timezone (over-engineering)

**Decision 5: Auto-cleanup invalid subscriptions**
- **Rationale**: Keeps DB clean, improves performance, standard practice
- **Trade-offs**: Loss of subscription history
- **Alternatives rejected**: Log only (doesn't scale)

### Known Risks

**Risk 1: Service worker lifecycle**
- **Description**: Service workers can be terminated by the OS, missing push events
- **Likelihood**: Low (Web Push is designed to work even with terminated SW)
- **Mitigation**: Web Push protocol handles SW wakeup; test on multiple browsers
- **Research needed**: Test on iOS Safari (stricter background limits)

**Risk 2: VAPID key compromise**
- **Description**: Private key exposed, attacker can send malicious notifications
- **Likelihood**: Very low (stored as Supabase secret, not in code)
- **Mitigation**: Rotate keys if compromised, revoke old subscriptions
- **Research needed**: Document key rotation procedure

**Risk 3: Push service rate limiting**
- **Description**: Browser push services may rate limit requests
- **Likelihood**: Medium (depends on user growth)
- **Mitigation**: Batch notifications, implement exponential backoff
- **Research needed**: Monitor delivery rates, adjust batch size

**Risk 4: iOS Safari limitations**
- **Description**: iOS has stricter background processing limits
- **Likelihood**: High (known limitation)
- **Mitigation**: Document iOS limitations, test on real device
- **Research needed**: Verify iOS 16.4+ push support

## Architecture Decision Records

- [ADR-001: Implementação Completa de Notificações Push](adrs/adr-001.md) — Decisão de implementar todos os tipos de notificação em um único MVP
- [ADR-002: deno-web-push Library](adrs/adr-002.md) — Escolha de biblioteca Deno nativa para Web Push
- [ADR-003: injectManifest Service Worker Strategy](adrs/adr-003.md) — Migração para service worker customizado com controle total de eventos
- [ADR-004: Single Edge Function for Notifications](adrs/adr-004.md) — Uso de função única send-notifications para todos os tipos
- [ADR-005: Fixed Brasília Timezone](adrs/adr-005.md) — Horário fixo de Brasília para notificações agendadas
- [ADR-006: Auto-cleanup Invalid Push Subscriptions](adrs/adr-006.md) — Remoção automática de subscriptions inválidas
