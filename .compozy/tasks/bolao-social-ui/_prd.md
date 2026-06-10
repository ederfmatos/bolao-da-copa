# PRD: Bolão Social UI Redesign

## Overview

Enhance the Bolão Copa 2026 app with social features and a modern visual redesign. Participants will be able to see other users' predictions for each match, fostering engagement and friendly competition. The app will receive a complete visual overhaul with dark/light mode support, a bottom navigation bar, and a modern Tailwind CSS-based design system.

**Problem it solves**: The current app is a single-user experience — participants cannot see what others predicted, reducing social engagement and the "bolão" spirit. The visual design is basic with inline styles and no theme support.

**Who it is for**: All participants of the World Cup 2026 prediction pool who want a more engaging, social, and visually appealing experience.

**Why it is valuable**: Seeing others' predictions creates conversation, friendly rivalry, and increases daily engagement. A modern UI improves perceived quality and encourages adoption.

## Goals

- Increase daily active usage by enabling social comparison (see others' predictions)
- Deliver a modern, professional visual experience that matches current mobile app standards
- Support user preference for dark/light mode with persistent toggle
- Maintain all existing functionality (predictions, leaderboard, rules) without regression
- Complete redesign and social features delivered in a single release

## User Stories

### Primary Persona: Participant

- As a participant, I want to see what other people predicted for a match so that I can compare my prediction with theirs and discuss the game.
- As a participant, I want to see how many people have already predicted for a match so that I feel urgency to submit my own prediction.
- As a participant, I want to switch between dark and light mode so that the app is comfortable to use at any time of day.
- As a participant, I want a bottom navigation bar so that I can quickly switch between matches, leaderboard, and rules without losing my place.
- As a participant, I want the app to look modern and polished so that I feel proud sharing it with friends.

### Secondary Persona: Late Joiner

- As a late joiner, I want to see all predictions (including past matches) so that I can understand how others performed and catch up on the competition.

## Core Features

### 1. Match Details Screen with Social Predictions

When a user taps on a match, they see a detail screen showing:
- Match info (teams, flags, group, time, status)
- The user's own prediction (with edit capability if still open)
- A list of all other participants' predictions, each showing: avatar, name, predicted score, and points earned (for finished matches)
- Predictions are always visible regardless of match status

### 2. Match Card Prediction Summary

Each match card in the list shows a compact summary:
- Number of participants who predicted (e.g., "8 palpites")
- Visual indicator if the current user has predicted (existing "Palpitado" badge)

### 3. Dark/Light Mode with Toggle

- App supports both dark and light themes
- Toggle accessible from the navigation bar or a settings area
- Theme preference persists across sessions
- Default: follows system preference on first visit

### 4. Bottom Navigation Bar

- Fixed bottom navigation with 3 tabs: Matches, Leaderboard, Rules
- Active tab highlighted with icon and color change
- Persistent across all authenticated pages
- Mobile-first design pattern

### 5. Visual Redesign with Tailwind CSS

- Replace all inline styles with Tailwind CSS utility classes
- Modern card-based design with improved spacing, typography, and color palette
- Dark mode: dark backgrounds (#0D0D0D to #1A1A1A) with vibrant accents
- Light mode: clean whites and grays with the same accent colors
- Consistent design system across all pages

### 6. Relaxed Prediction Visibility (RLS Update)

- All authenticated users can read all predictions (not just their own)
- Profiles (name, avatar) visible to all authenticated users
- No change to write permissions (users still only edit their own predictions)

## User Experience

### Primary Flow: View Match and Others' Predictions

1. User opens app → sees Matches page with bottom navigation
2. User taps on a match card → navigates to Match Details
3. Match Details shows: match info, user's own prediction (editable if open), and a scrollable list of all other participants' predictions
4. Each prediction in the list shows: avatar, name, predicted score, and points (if match finished)
5. User can toggle between dark and light mode from the navigation

### Primary Flow: Theme Switching

1. User taps the theme toggle icon in the bottom navigation
2. App immediately switches between dark and light mode
3. Preference is saved and restored on next visit

### Onboarding

- No changes to login flow (still Google OAuth)
- After login, user lands on Matches page (same as before)
- Bottom navigation is immediately visible, making it clear how to navigate
- Match cards now show prediction counts, encouraging exploration

## High-Level Technical Constraints

- Must integrate with existing Supabase backend (PostgreSQL, Auth, Edge Functions)
- Must maintain existing RLS write restrictions (users only edit their own predictions)
- Must support real-time leaderboard updates (existing Supabase Realtime subscription)
- Must remain mobile-first and performant on low-end devices
- Tailwind CSS must be configured with dark mode support (class-based strategy)

## Non-Goals (Out of Scope)

- Friend/follow system (no ability to follow specific users)
- Private prediction groups or invite codes
- Push notifications for match results or prediction deadlines
- Chat or comments on predictions
- Prediction statistics or analytics dashboards
- Historical data import from past tournaments
- Admin panel for managing participants

## Phased Rollout Plan

### MVP (Single Release)

All features delivered together:
- Tailwind CSS migration (all pages)
- Dark/light mode with toggle
- Bottom navigation bar
- Match Details screen with social predictions
- Match card prediction summary
- RLS update for prediction visibility

**Success criteria**: All pages render correctly in both themes, all users can see others' predictions, no regression in existing features, build passes without errors.

## Success Metrics

- 100% of pages migrated to Tailwind CSS with zero inline styles
- Dark/light mode toggle works on all pages without visual glitches
- Match Details screen loads all predictions within 2 seconds
- Zero regression: all existing features (predict, leaderboard, rules) work identically
- Build size remains under 500KB gzipped
- Lighthouse performance score >= 90 on mobile

## Risks and Mitigations

- **Risk**: Tailwind migration breaks existing layouts
  - **Mitigation**: Visual regression testing on each page after migration
- **Risk**: RLS change exposes predictions before user intends
  - **Mitigation**: User explicitly chose "always visible"; clear communication in Rules page
- **Risk**: Dark mode has contrast or readability issues
  - **Mitigation**: Follow WCAG AA contrast guidelines; test on real devices
- **Risk**: Bottom navigation takes too much screen space on small devices
  - **Mitigation**: Use compact icon-only mode on very small screens (< 360px)

## Architecture Decision Records

- [ADR-005: Redesign completo em uma fase com Tailwind CSS](adrs/adr-005.md) — Decision to deliver all visual and social features in a single phase rather than incrementally

## Open Questions

- Should the Match Details screen show predictions sorted by points (for finished matches) or alphabetically/by submission time?
- Should there be a visual distinction between the user's own prediction and others' on the Match Details screen?
- Should the prediction count on MatchCard show only the number or also a mini breakdown (e.g., "8 palpites, 3 exatos")?
