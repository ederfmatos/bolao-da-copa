---
status: pending
title: Create user_predictions view migration
type: infra
complexity: low
dependencies: []
---

# Create user_predictions view migration

## Overview

Create a database migration to add a new view `user_predictions` that joins predictions with matches data. This view will be used by the useUserPredictions hook to fetch all predictions for a specific user with complete match information.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC 'Data Models' section for the view definition
- FOCUS ON 'WHAT' — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
1. MUST create migration file at `supabase/migrations/0006_user_predictions_view.sql`
2. MUST create view `user_predictions` joining predictions and matches tables
3. MUST include all fields specified in TechSpec (prediction_id, user_id, match_id, predicted scores, points, match details)
4. MUST order results by created_at DESC
5. MUST use CREATE OR REPLACE VIEW for idempotency
6. SHOULD verify view is queryable after migration
</requirements>

## Subtasks

- [ ] Create migration file 0006_user_predictions_view.sql
- [ ] Define view joining predictions and matches
- [ ] Verify migration applies without errors
- [ ] Test view returns expected data structure

## Implementation Details

Files to create:
- `supabase/migrations/0006_user_predictions_view.sql` — migration with view definition

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` — original tables definition
- `supabase/migrations/0003_social_rls.sql` — match_predictions view as reference

### Dependent Files
- `src/hooks/useUserPredictions.js` — will query this view (task_02)

### Related ADRs
- [ADR-002: View user_predictions for profile data](../adrs/adr-002.md) — Decision to use database view for data fetching

## Deliverables

- Migration file created and applies cleanly
- View `user_predictions` queryable with expected structure
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for view **(REQUIRED)**

## Tests

### Unit Tests
- [ ] Migration is idempotent — running twice produces no errors
- [ ] View contains all required columns (prediction_id, user_id, match_id, predicted_home, predicted_away, points, match details)
- [ ] View returns predictions ordered by created_at DESC
- [ ] View correctly joins predictions with matches data

### Integration Tests
- [ ] Query view for a user with predictions returns complete data
- [ ] Query view for a user without predictions returns empty result
- [ ] View data matches expected structure from TechSpec

## Success Criteria

- Migration applies cleanly to database
- View returns correct data structure
- All tests passing
- Test coverage >=80%
