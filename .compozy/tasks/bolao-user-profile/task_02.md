---
status: completed
title: Create useUserPredictions hook
type: frontend
complexity: low
dependencies: 
  - task_01
---

# Create useUserPredictions hook

## Overview

Create a React hook that fetches all predictions for a specific user from the `user_predictions` view. The hook will provide predictions data, loading state, and error handling for the UserProfile page.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Core Interfaces' section for hook signature and return type
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST create `src/hooks/useUserPredictions.js`
2. MUST accept userId parameter
3. MUST query `user_predictions` view filtered by user_id
4. MUST return `{ predictions, loading, error }`
5. MUST handle null/undefined userId gracefully
6. MUST re-fetch when userId changes
7. SHOULD follow existing hook patterns (useMatches, useMatchPredictions)
</requirements>

## Subtasks

- [x] Create useUserPredictions.js hook file
- [x] Implement fetch logic querying user_predictions view
- [x] Add loading and error state management
- [x] Handle null userId case
- [x] Add useEffect dependency on userId

## Implementation Details

Files to create:
- `src/hooks/useUserPredictions.js` — hook implementation

### Relevant Files
- `src/hooks/useMatchPredictions.js` — similar hook pattern to follow
- `src/lib/supabase.js` — Supabase client

### Dependent Files
- `src/pages/UserProfile.jsx` — will use this hook (task_06)

## Deliverables

- Hook created and functional
- Returns predictions with correct data structure
- Handles loading and error states
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for hook **(REQUIRED)**

## Tests

### Unit Tests
- [x] Hook returns { predictions, loading, error }
- [x] Loading is true initially, then false after fetch
- [x] Error is set when query fails
- [x] Predictions are returned in correct format
- [x] Hook handles null userId without error
- [x] Hook re-fetches when userId changes

### Integration Tests
- [x] Query to user_predictions view returns predictions with match data
- [x] Empty result set returns empty array, not null

## Success Criteria

- Hook fetches and returns user predictions correctly
- Includes all match details from view
- Loading and error states work correctly
- All tests passing
- Test coverage >=80%
