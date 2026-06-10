---
status: pending
title: Build verification and visual QA
type: test
complexity: low
dependencies: 
  - task_07
---

# Build verification and visual QA

## Overview

Verify the build passes and perform visual QA across all pages. Ensure user profile feature works correctly with navigation from leaderboard and prediction lists.

<critical>
- Run `npm run build` and verify zero errors
- Test all navigation flows
- Verify dark mode works on new components
- Check mobile responsiveness
- Tests are required
</critical>

<requirements>
1. MUST run `npm run build` with zero errors
2. MUST verify no inline styles in new components
3. MUST test navigation from Leaderboard to UserProfile
4. MUST test navigation from PredictionRow to UserProfile
5. MUST test back button preserves context
6. MUST test deep linking to /user/:userId
7. MUST test all new components in dark mode
8. SHOULD test on mobile viewport sizes
9. SHOULD run Lighthouse audit for performance
</requirements>

## Subtasks

- [ ] Run `npm run build` and verify success
- [ ] Grep for inline styles in new components
- [ ] Test navigation from Leaderboard to UserProfile
- [ ] Test navigation from PredictionRow to UserProfile
- [ ] Test back button functionality
- [ ] Test deep linking to /user/:userId
- [ ] Test all new components in dark mode
- [ ] Test on mobile viewport (375px width)
- [ ] Run Lighthouse audit

## Implementation Details

### Relevant Files
- All new src/ files
- `src/App.jsx` — routing
- `src/components/LeaderboardRow.jsx` — navigation
- `src/components/PredictionRow.jsx` — navigation

### Dependent Files
- None

## Deliverables

- Build passes with zero errors
- No inline styles in new components
- All navigation flows work
- Dark mode works on all new components
- Mobile layout is usable

## Tests

### Unit Tests
- [ ] `npm run build` succeeds
- [ ] Build size < 500KB gzipped

### Integration Tests
- [ ] No inline styles in new components
- [ ] Navigation from Leaderboard works
- [ ] Navigation from PredictionRow works
- [ ] Back button preserves context
- [ ] Deep linking works
- [ ] Dark mode works on all new components
- [ ] Mobile layout (375px) is usable

## Success Criteria

- Build passes
- No inline styles
- All navigation flows work
- Dark mode works
- Mobile layout is usable
- Performance score >= 90
