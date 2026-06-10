---
status: pending
title: Create UserStats component
type: frontend
complexity: low
dependencies: []
---

# Create UserStats component

## Overview

Create a component that displays summary statistics for a user's predictions: total predictions count, distribution by points (10, 7, 3, 0), and exact score rate percentage.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Data Models' section for statistics calculation
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST create `src/components/UserStats.jsx`
2. MUST display total predictions count
3. MUST display distribution by points (count of 10pts, 7pts, 3pts, 0pts)
4. MUST display exact score rate as percentage
5. MUST accept predictions array as prop
6. MUST calculate statistics from predictions data
7. MUST use Tailwind CSS with dark mode support
8. SHOULD handle empty predictions gracefully
</requirements>

## Subtasks

- [ ] Create UserStats.jsx component
- [ ] Calculate statistics from predictions array
- [ ] Display total predictions count
- [ ] Display distribution by points
- [ ] Display exact score rate percentage
- [ ] Style with Tailwind and dark mode

## Implementation Details

Files to create:
- `src/components/UserStats.jsx` — component implementation

### Relevant Files
- `src/components/MatchCard.jsx` — similar card styling pattern

### Dependent Files
- `src/pages/UserProfile.jsx` — will use this component (task_06)

## Deliverables

- Component created and renders correctly
- Statistics calculated accurately
- Dark mode supported
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

### Unit Tests
- [ ] Component renders without errors
- [ ] Total predictions count is correct
- [ ] Distribution counts are accurate (10pts, 7pts, 3pts, 0pts)
- [ ] Exact score rate percentage is calculated correctly
- [ ] Component handles empty predictions array
- [ ] Component handles predictions with no points

### Integration Tests
- [ ] Component renders correctly with real prediction data

## Success Criteria

- Statistics are calculated correctly
- All values display accurately
- Dark mode works
- All tests passing
- Test coverage >=80%
