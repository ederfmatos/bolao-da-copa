---
status: completed
title: Create PredictionRow component
type: frontend
complexity: low
dependencies: [task_08]
---

# Create PredictionRow component

## Overview

Create a component to display a single prediction in the social predictions list. Shows avatar, name, predicted score, and points (for finished matches).

<critical>
Read TechSpec "Component Specifications: PredictionRow Component" before starting.
- Support isCurrentUser prop for visual distinction.
- Show points badge with color coding for finished matches.
- Tests are required.
</critical>

<requirements>
1. MUST create `src/components/PredictionRow.jsx`.
2. MUST display user avatar (40x40, rounded).
3. MUST display user name (bold if isCurrentUser).
4. MUST display predicted score (home × away).
5. MUST display points badge for finished matches.
6. MUST accept props: { prediction, isCurrentUser, isFinished }.
7. MUST use Tailwind CSS with dark mode support.
8. SHOULD highlight current user row with distinct background.
9. SHOULD color-code points badge (green=10, blue=7, orange=3, gray=0).
</requirements>

## Subtasks

- [x] Create PredictionRow.jsx component (already existed from task_08).
- [x] Display avatar, name, and score.
- [x] Add isCurrentUser styling (bold name, background highlight).
- [x] Add points badge for finished matches.
- [x] Color-code points badge.
- [x] Style with Tailwind and dark mode.

## Implementation Details

Files to create:
- `src/components/PredictionRow.jsx` — full implementation.

### Relevant Files
- `src/pages/MatchDetails.jsx` — will render this component.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- PredictionRow component created.
- Displays prediction data correctly.
- Current user highlighted.
- Points badge color-coded.

## Tests

### Unit Tests
- [x] Component renders without errors.
- [x] Avatar displays with correct src.
- [x] Avatar fallback renders initials.
- [x] Name displays (bold if isCurrentUser).
- [x] Score displays as "home × away".
- [x] Points badge shows only when isFinished is true.
- [x] Points badge hidden when points is null.
- [x] Points badge color is correct (green=10, blue=7, orange=3, gray=0).
- [x] Current user row has distinct background.
- [x] Non-current user uses default background.

### Integration Tests
- [x] Component renders correctly in MatchDetails list (verified via existing MatchDetails test).

## Success Criteria

- PredictionRow displays prediction data.
- Visual distinction for current user.
- Points badge color-coded correctly.
