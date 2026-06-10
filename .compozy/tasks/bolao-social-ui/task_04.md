---
status: pending
title: Create useMatchPredictions hook
type: frontend
complexity: low
dependencies: [task_03]
---

# Create useMatchPredictions hook

## Overview

Create a hook to fetch all predictions for a specific match, including user profile data. This hook will power the social predictions display on the MatchDetails page.

<critical>
Read TechSpec "New Hook: useMatchPredictions" section before starting.
- Query the match_predictions view, not the predictions table directly.
- Sort by points DESC (for finished matches) or created_at ASC.
- Tests are required.
</critical>

<requirements>
1. MUST create `src/hooks/useMatchPredictions.js`.
2. MUST query `match_predictions` view filtered by match_id.
3. MUST expose `{ predictions, loading, error }`.
4. MUST sort results by points DESC, then created_at ASC.
5. MUST handle null/undefined matchId gracefully.
6. SHOULD re-fetch when matchId changes.
</requirements>

## Subtasks

- [ ] Create src/hooks/useMatchPredictions.js.
- [ ] Implement fetch logic with match_predictions view.
- [ ] Add sorting by points DESC, created_at ASC.
- [ ] Handle loading and error states.
- [ ] Handle null matchId case.

## Implementation Details

Files to create:
- `src/hooks/useMatchPredictions.js` — full implementation.

### Relevant Files
- `src/lib/supabase.js` — Supabase client.
- `supabase/migrations/0003_social_rls.sql` — creates match_predictions view.

### Dependent Files
- `src/pages/MatchDetails.jsx` — will use this hook.

### Related ADRs
- None.

## Deliverables

- useMatchPredictions hook created and functional.
- Returns predictions with user profile data.
- Handles loading and error states.

## Tests

### Unit Tests
- [ ] Hook returns { predictions, loading, error }.
- [ ] Loading is true initially, then false after fetch.
- [ ] Error is set when query fails.
- [ ] Predictions are sorted by points DESC, created_at ASC.
- [ ] Hook handles null matchId without error.
- [ ] Hook re-fetches when matchId changes.

### Integration Tests
- [ ] Query to match_predictions returns predictions with user_name and user_avatar_url.
- [ ] Empty result set returns empty array, not null.

## Success Criteria

- Hook fetches and returns match predictions correctly.
- Includes user profile data (name, avatar).
- Sorting works as specified.
