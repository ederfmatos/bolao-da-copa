---
status: pending
title: Create UserProfile page
type: frontend
complexity: medium
dependencies: 
  - task_02
  - task_03
  - task_04
  - task_05
---

# Create UserProfile page

## Overview

Create the main UserProfile page that assembles all components (header, stats, prediction list) and fetches user data. This page will be accessible via `/user/:userId` route.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Component Overview' section for page structure
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST create `src/pages/UserProfile.jsx`
2. MUST extract userId from URL params
3. MUST fetch user predictions using useUserPredictions hook
4. MUST fetch user profile info from leaderboard view
5. MUST display UserProfileHeader with profile info
6. MUST display UserStats with statistics
7. MUST display list of UserPredictionRow components
8. MUST handle loading and error states
9. MUST include 'Voltar' button using navigate(-1)
10. MUST use Tailwind CSS with dark mode support
</requirements>

## Subtasks

- [ ] Create UserProfile.jsx page
- [ ] Extract userId from URL params
- [ ] Fetch user predictions and profile info
- [ ] Assemble UserProfileHeader, UserStats, and prediction list
- [ ] Add loading and error states
- [ ] Add 'Voltar' button with navigate(-1)
- [ ] Style with Tailwind and dark mode

## Implementation Details

Files to create:
- `src/pages/UserProfile.jsx` — page implementation

### Relevant Files
- `src/pages/MatchDetails.jsx` — similar page pattern with back button
- `src/hooks/useUserPredictions.js` — hook to fetch predictions (task_02)
- `src/hooks/useLeaderboard.js` — hook to fetch profile info

### Dependent Files
- `src/App.jsx` — will add route (task_07)

### Related ADRs
- [ADR-001: Dedicated profile page](../adrs/adr-001.md) — Decision to create dedicated page

## Deliverables

- Page created and functional
- Displays all user profile information
- Prediction list renders correctly
- Loading and error states handled
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for page **(REQUIRED)**

## Tests

### Unit Tests
- [ ] Page renders without errors
- [ ] UserProfileHeader displays with correct data
- [ ] UserStats displays with correct statistics
- [ ] Prediction list renders all predictions
- [ ] Loading state displays while fetching
- [ ] Error state displays on fetch failure
- [ ] 'Voltar' button calls navigate(-1)
- [ ] Page handles user with no predictions

### Integration Tests
- [ ] Page loads and displays user data correctly
- [ ] Navigation to and from page works correctly
- [ ] Deep linking to /user/:userId works

## Success Criteria

- Page displays all profile information correctly
- Prediction list renders chronologically
- Navigation works correctly
- All tests passing
- Test coverage >=80%
