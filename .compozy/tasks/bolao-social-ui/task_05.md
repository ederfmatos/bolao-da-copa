---
status: pending
title: Update useMatches hook with prediction counts
type: frontend
complexity: low
dependencies: [task_03]
---

# Update useMatches hook with prediction counts

## Overview

Update the useMatches hook to also fetch prediction counts per match. This data will be displayed on MatchCard to show how many participants have predicted.

<critical>
Read TechSpec "Updated Hook: useMatches" section before starting.
- Add predictionCounts to the return value.
- Maintain backward compatibility with existing usage.
- Tests are required.
</critical>

<requirements>
1. MUST update `src/hooks/useMatches.js` to fetch prediction counts.
2. MUST expose `predictionCounts` as a map of match_id → count.
3. MUST maintain existing `{ matches, loading, error }` return shape.
4. MUST fetch counts in the same effect as matches (single fetch cycle).
5. SHOULD handle empty prediction data gracefully.
</requirements>

## Subtasks

- [ ] Update useMatches.js to fetch prediction counts.
- [ ] Add predictionCounts state and return value.
- [ ] Build counts map from predictions query.
- [ ] Verify existing functionality still works.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/lib/supabase.js` — Supabase client.

### Dependent Files
- `src/pages/Matches.jsx` — will use predictionCounts.
- `src/components/MatchCard.jsx` — will display count.

### Related ADRs
- None.

## Deliverables

- useMatches returns predictionCounts map.
- Existing functionality unchanged.
- Build passes.

## Tests

### Unit Tests
- [ ] Hook returns { matches, predictionCounts, loading, error }.
- [ ] predictionCounts is an object mapping match_id to count.
- [ ] Empty predictions result in empty predictionCounts object.
- [ ] Loading and error states work correctly.

### Integration Tests
- [ ] Query fetches matches and prediction counts.
- [ ] Counts are accurate for matches with multiple predictions.

## Success Criteria

- predictionCounts is correctly populated.
- Existing useMatches functionality unchanged.
- Build passes.
