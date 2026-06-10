---
status: completed
title: Create UserProfileHeader component
type: frontend
complexity: low
dependencies: []
---

# Create UserProfileHeader component

## Overview

Create a component that displays the user's profile header with avatar, name, total points, and ranking position. This component will be used at the top of the UserProfile page.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Component Overview' section for component structure
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST create `src/components/UserProfileHeader.jsx`
2. MUST display user avatar (reusing Avatar component)
3. MUST display user name
4. MUST display total points
5. MUST display ranking position
6. MUST accept props: { name, avatarUrl, totalPoints, rank }
7. MUST use Tailwind CSS with dark mode support
8. SHOULD follow existing component patterns
</requirements>

## Subtasks

- [x] Create UserProfileHeader.jsx component
- [x] Display avatar using Avatar component
- [x] Display name, total points, and rank
- [x] Style with Tailwind and dark mode
- [x] Add responsive layout

## Implementation Details

Files to create:
- `src/components/UserProfileHeader.jsx` — component implementation

### Relevant Files
- `src/components/Avatar.jsx` — avatar component to reuse
- `src/components/LeaderboardRow.jsx` — similar styling pattern

### Dependent Files
- `src/pages/UserProfile.jsx` — will use this component (task_06)

## Deliverables

- Component created and renders correctly
- Displays all profile information
- Dark mode supported
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

### Unit Tests
- [x] Component renders without errors
- [x] Avatar displays correctly
- [x] Name displays correctly
- [x] Total points displays with correct formatting
- [x] Rank displays correctly
- [x] Component handles missing avatar gracefully

### Integration Tests
- [ ] Component renders correctly within UserProfile page context (deferred to task_06)

## Success Criteria

- Component displays all profile information correctly
- Dark mode works
- All tests passing
- Test coverage >=80%
