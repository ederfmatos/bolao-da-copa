---
status: pending
title: Create UserPredictionRow component
type: frontend
complexity: low
dependencies: []
---

# Create UserPredictionRow component

## Overview

Create a component that displays a single prediction in the user's prediction history list. Shows match info (teams, flags, group, time), predicted score, actual result (if finished), and points earned.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Component Overview' section for component structure
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST create `src/components/UserPredictionRow.jsx`
2. MUST display match info (teams with flags, group, date/time)
3. MUST display predicted score
4. MUST display actual result if match is finished
5. MUST display points earned with color coding (green=10, blue=7, orange=3, gray=0)
6. MUST display 'Aguardando' for non-finished matches
7. MUST accept prediction object as prop
8. MUST use Tailwind CSS with dark mode support
</requirements>

## Subtasks

- [ ] Create UserPredictionRow.jsx component
- [ ] Display match info (teams, flags, group, time)
- [ ] Display predicted score
- [ ] Display actual result or 'Aguardando'
- [ ] Display points with color coding
- [ ] Style with Tailwind and dark mode

## Implementation Details

Files to create:
- `src/components/UserPredictionRow.jsx` — component implementation

### Relevant Files
- `src/components/PredictionRow.jsx` — similar component for reference
- `src/components/MatchCard.jsx` — match display pattern

### Dependent Files
- `src/pages/UserProfile.jsx` — will use this component (task_06)

## Deliverables

- Component created and renders correctly
- Displays all prediction information
- Color coding works correctly
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

### Unit Tests
- [ ] Component renders without errors
- [ ] Match info displays correctly (teams, flags, group, time)
- [ ] Predicted score displays correctly
- [ ] Actual result displays for finished matches
- [ ] 'Aguardando' displays for non-finished matches
- [ ] Points display with correct color (green=10, blue=7, orange=3, gray=0)
- [ ] Component handles null actual scores

### Integration Tests
- [ ] Component renders correctly in UserPredictionList context

## Success Criteria

- All prediction information displays correctly
- Color coding works as specified
- Dark mode works
- All tests passing
- Test coverage >=80%
