---
status: completed
title: Create MatchDetails page
type: frontend
complexity: medium
dependencies: [task_04, task_05, task_07]
---

# Create MatchDetails page

## Overview

Create the MatchDetails page that shows match info, the user's own prediction (editable if open), and a list of all other participants' predictions. This page replaces the old Predict page.

<critical>
Read TechSpec "Component Specifications: MatchDetails Page" before starting.
- Combine match info, user prediction, and social predictions in one screen.
- Use useMatchPredictions for social data.
- Use usePredictions for user's own prediction.
- Tests are required.
</critical>

<requirements>
1. MUST create `src/pages/MatchDetails.jsx`.
2. MUST fetch match data by ID from URL params.
3. MUST display match info (teams, flags, group, time, status).
4. MUST show user's own prediction with ScorePicker (editable if open).
5. MUST show list of other participants' predictions via PredictionRow.
6. MUST display prediction count in header.
7. MUST handle loading and error states.
8. MUST use Tailwind CSS with dark mode support.
9. SHOULD separate user's prediction from others visually.
10. SHOULD show points for finished matches.
</requirements>

## Subtasks

- [x] Create MatchDetails.jsx page.
- [x] Fetch match data by ID.
- [x] Display match info section.
- [x] Display user's prediction section with ScorePicker.
- [x] Fetch and display social predictions list.
- [x] Add prediction count to header.
- [x] Style with Tailwind and dark mode.
- [x] Handle loading and error states.

## Implementation Details

Files to create:
- `src/pages/MatchDetails.jsx` — full implementation.

### Relevant Files
- `src/hooks/useMatchPredictions.js` — social predictions.
- `src/hooks/usePredictions.js` — user's prediction.
- `src/components/ScorePicker.jsx` — score input.
- `src/components/PredictionRow.jsx` — social prediction row.

### Dependent Files
- `src/App.jsx` — route /match/:matchId.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- MatchDetails page created and functional.
- Shows match info, user prediction, and social predictions.
- Editable prediction for open matches.
- Styled with Tailwind and dark mode.

## Tests

### Unit Tests
- [x] Page renders without errors.
- [x] Match info displays correctly (teams, flags, group, time).
- [x] User's prediction section shows ScorePicker for open matches.
- [x] User's prediction section is read-only for closed/finished matches.
- [x] Social predictions list renders PredictionRow for each prediction.
- [x] Prediction count displays in header.
- [x] Loading state shows while data fetches.
- [x] Error state displays error message.

### Integration Tests
- [x] Navigating to /match/:matchId loads match data.
- [x] Saving prediction updates user's prediction.
- [ ] Social predictions refresh after save.

## Success Criteria

- MatchDetails page works end-to-end.
- User can view and edit predictions.
- Social predictions display correctly.
- Tailwind styling applied.
