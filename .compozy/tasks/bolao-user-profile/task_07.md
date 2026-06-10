---
status: pending
title: Add route and navigation links
type: frontend
complexity: medium
dependencies: 
  - task_06
---

# Add route and navigation links

## Overview

Add the `/user/:userId` route to App.jsx and make user names/avatars clickable in LeaderboardRow and PredictionRow components to navigate to user profiles.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Impact Analysis' section for affected components
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST add route `/user/:userId` in App.jsx
2. MUST wrap UserProfile in ProtectedRoute
3. MUST make name and avatar clickable in LeaderboardRow
4. MUST make name and avatar clickable in PredictionRow
5. MUST navigate to `/user/:userId` on click
6. MUST preserve existing functionality
7. MUST use Tailwind CSS for clickable styling (cursor-pointer, hover effects)
</requirements>

## Subtasks

- [ ] Add route /user/:userId in App.jsx
- [ ] Import UserProfile component
- [ ] Make LeaderboardRow name/avatar clickable
- [ ] Make PredictionRow name/avatar clickable
- [ ] Add hover effects for clickable elements
- [ ] Verify existing functionality preserved

## Implementation Details

Files to modify:
- `src/App.jsx` — add route for UserProfile
- `src/components/LeaderboardRow.jsx` — add navigation link
- `src/components/PredictionRow.jsx` — add navigation link

### Relevant Files
- `src/App.jsx` — routing configuration
- `src/components/LeaderboardRow.jsx` — leaderboard entry component
- `src/components/PredictionRow.jsx` — prediction entry component

### Dependent Files
- None — this is the final integration task

## Deliverables

- Route added and functional
- Navigation links work from Leaderboard
- Navigation links work from PredictionRow
- Existing functionality preserved
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for navigation **(REQUIRED)**

## Tests

### Unit Tests
- [ ] Route /user/:userId exists in App.jsx
- [ ] UserProfile is wrapped in ProtectedRoute
- [ ] LeaderboardRow name is clickable
- [ ] LeaderboardRow avatar is clickable
- [ ] PredictionRow name is clickable (when not current user)
- [ ] PredictionRow avatar is clickable (when not current user)
- [ ] Clicking navigates to correct /user/:userId path

### Integration Tests
- [ ] Navigation from Leaderboard to UserProfile works
- [ ] Navigation from PredictionRow to UserProfile works
- [ ] Back button returns to previous page
- [ ] Existing Leaderboard functionality preserved
- [ ] Existing PredictionRow functionality preserved

## Success Criteria

- Route is accessible
- Navigation works from both entry points
- No regression in existing features
- All tests passing
- Test coverage >=80%
