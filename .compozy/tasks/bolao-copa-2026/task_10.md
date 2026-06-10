---
status: completed
title: Score prediction — ScorePicker + usePredictions
type: frontend
complexity: medium
dependencies: [task_09]
---

## Overview

Implement the `ScorePicker` component and `usePredictions` hook that allow participants to submit and edit score predictions for open matches. Predictions lock automatically 1 hour before kickoff — enforced both in the UI and at database level (RLS from task_01).

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Core Interfaces" and PRD "Core Features — Score Prediction".
- The 1-hour deadline is enforced by RLS — the UI must reflect this state clearly but is not the security layer.
- Focus on the prediction input UX and save flow — not points display.
- Tests are required.
</critical>

<requirements>
1. MUST implement `usePredictions` hook exposing `{ predictions, savePrediction, loading, error }`.
2. MUST implement `ScorePicker` component with +/− buttons for home and away scores (min: 0, no max).
3. MUST implement `Predict` page showing the match details + `ScorePicker` + save button.
4. MUST pre-populate `ScorePicker` with the user's existing prediction if one exists.
5. MUST show a deadline warning when the match is within 3 hours of kickoff.
6. MUST disable the save button and show a "Predictions closed" message when within 1 hour of kickoff.
7. MUST handle the RLS rejection gracefully — if the DB rejects a save (deadline passed), show a clear error message.
8. MUST show a success confirmation after saving.
9. MUST upsert predictions (insert or update) using `onConflict: 'user_id, match_id'`.
</requirements>

## Subtasks

- [ ] Implement `usePredictions` hook with fetch and upsert logic.
- [ ] Implement `ScorePicker` component with +/− controls.
- [ ] Implement `Predict` page assembling match info + ScorePicker + save flow.
- [ ] Add deadline awareness: warning at 3h, disabled state at 1h.
- [ ] Handle RLS rejection error gracefully.
- [ ] Pre-populate existing prediction on mount.

## Implementation Details

Files to modify/create:
- `src/hooks/usePredictions.js` — full implementation.
- `src/components/ScorePicker.jsx` — full implementation.
- `src/pages/Predict.jsx` — full implementation.

### Relevant Files
- `src/lib/supabase.js`
- `src/hooks/useAuth.js` — for user ID.
- `src/hooks/useMatches.js` — to get match details for the prediction screen.

### Dependent Files
- `src/pages/Matches.jsx` — shows prediction indicators using `usePredictions` (task_09).

### Related ADRs
- None.

## Deliverables

- Participant can submit and edit a prediction for any open match.
- Prediction is pre-populated on revisit.
- Save is disabled within 1 hour of kickoff.
- Success and error states are clearly communicated.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `ScorePicker` renders initial scores correctly.
- [ ] Tapping + increments the score.
- [ ] Tapping − decrements the score but not below 0.
- [ ] `usePredictions` calls upsert with correct `user_id`, `match_id`, `home_score`, `away_score`.
- [ ] `usePredictions` returns `error` when Supabase rejects the upsert.
- [ ] Save button is disabled when `kickoff_at <= now + 1h`.
- [ ] Deadline warning is shown when `kickoff_at <= now + 3h` and `> now + 1h`.

### Integration Tests
- [ ] Submitting a prediction inserts a row in `predictions`.
- [ ] Resubmitting updates the existing row (no duplicate created).
- [ ] Visiting `/predict/:matchId` with an existing prediction pre-populates the scores.
- [ ] Attempting to save within the 1-hour window shows a clear error (RLS rejection).

## Success Criteria

- Prediction save and edit flow works end-to-end.
- Deadline enforcement reflected correctly in UI.
- RLS rejection handled gracefully.
- Test coverage >= 80%.
