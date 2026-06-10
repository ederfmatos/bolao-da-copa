# Bolão Copa 2026 — Product Requirements Document

## 1. Vision

A mobile-first web app that lets friends compete in a World Cup 2026 prediction pool. Participants predict match scores, earn points based on accuracy, and track their ranking on a real-time leaderboard.

## 2. Problem Statement

Existing prediction pool tools are either too generic, too complex, or lack real-time updates. We need a focused, easy-to-use app tailored specifically for the 2026 World Cup with transparent scoring and live rankings.

## 3. Target Users

- **Participants**: Friends/colleagues joining a private bolão. They want to predict scores quickly and see how they rank.
- **Admin** (implicit): The person who sets up the bolão and shares the link. No special admin panel needed for MVP.

## 4. Core Features

### 4.1 Authentication
- Users sign in with Google OAuth.
- Profile (name, avatar) is auto-created from Google identity data on first sign-in.
- No registration form, no password management.

### 4.2 Match Browsing
- View all 2026 World Cup matches (64 total: group stage + knockout).
- Matches grouped by status:
  - **Open**: scheduled and more than 1 hour from kickoff.
  - **Closed**: within 1-hour window or currently live.
  - **Finished**: final whistle blown, result available.
- Each match card shows: teams (with flags), group/round name, local date/time, status badge.
- Visual indicator on matches where the user has already submitted a prediction.
- All times displayed in user's local timezone.

### 4.3 Score Prediction
- For each open match, user enters a predicted score (home × away).
- Score input via +/− stepper controls (min: 0, no max).
- Predictions can be edited until the 1-hour deadline.
- Predictions are locked 1 hour before kickoff (enforced at DB level via RLS).
- UI shows a warning when a match is within 3 hours of kickoff.
- Save button disabled and "Predictions closed" message shown within 1 hour.
- Success/error feedback after save.

### 4.4 Scoring Rules
Five scoring scenarios, applied after each match finishes:

| Scenario | Points | Example |
|----------|--------|---------|
| Exact score | 10 | Predicted 2×1, actual 2×1 |
| Correct winner + correct goal difference | 7 | Predicted 2×0, actual 3×1 (both +2) |
| Correct draw (wrong score) | 7 | Predicted 1×1, actual 2×2 |
| Correct winner only | 3 | Predicted 1×0, actual 3×1 |
| Wrong result | 0 | Predicted 2×0, actual 0×1 |

### 4.5 Leaderboard
- Ranked list of all participants by total points.
- Each row: rank, avatar, name, total points.
- Current user's row highlighted.
- **Podium** component highlights top 3 with distinct visual treatment.
- Updates in **real time** via Supabase Realtime when points are assigned.
- Empty state when no predictions have been made yet.

### 4.6 Rules Page
- Static page explaining all five scoring scenarios with examples.
- Prominent notice about the 1-hour prediction deadline.
- Accessible from bottom navigation at all times.

## 5. Non-Functional Requirements

- **Mobile-first**: optimized for phone screens, usable on tablet/desktop.
- **Performance**: leaderboard updates within seconds of a match result.
- **Reliability**: match data synced automatically every 5 minutes from external providers with fallback chain.
- **Security**: row-level security ensures users can only see/edit their own predictions.
- **No secrets in frontend**: all API keys for football data providers live server-side only.

## 6. Data Sources

| Provider | Role |
|----------|------|
| football-data.org | Primary source for World Cup fixtures and results |
| API-Football (RapidAPI) | Fallback if primary fails |

Data sync runs every 5 minutes via a scheduled Edge Function.

## 7. Technology Constraints (from ADRs)

- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime).
- **Frontend**: React SPA with Vite.
- **Auth**: Google OAuth via Supabase Auth.
- **Deploy**: Vercel for frontend; Supabase hosted for backend.

## 8. Out of Scope (MVP)

- Private bolão groups / invite codes.
- Admin panel for managing participants.
- Push notifications for match results.
- Historical data from past World Cups.
- Payment / entry fee integration.
- Social sharing of predictions.

## 9. Success Metrics

- All 64 World Cup matches available in the app before tournament start.
- Participants can submit and edit predictions with a smooth UX.
- Leaderboard reflects accurate points within 30 seconds of a match result.
- Zero data loss or double-counting of points.
- App passes end-to-end smoke test on production.
