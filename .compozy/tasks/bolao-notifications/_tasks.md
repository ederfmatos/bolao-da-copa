# Bolão Notifications — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Migration 0008: push_subscriptions table + RLS | completed | low | — |
| 02 | Shared push helper (_shared/sendPush.ts) | completed | medium | task_01 |
| 03 | Register/unregister subscription edge function | completed | medium | task_01 |
| 04 | Send notifications edge function | completed | high | task_02, task_03 |
| 05 | Service worker + vite.config.js injectManifest | completed | medium | — |
| 06 | useNotifications hook | completed | medium | task_03 |
| 07 | NotificationPrompt component + App.jsx integration | completed | low | task_06 |
| 08 | NotificationToggle component + Profile integration | completed | low | task_06 |
| 09 | Modify sync-matches for post-match trigger | completed | medium | task_04 |
| 10 | Cron jobs migration (daily-digest + deadline-reminder) | completed | low | task_04 |
