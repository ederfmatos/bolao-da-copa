---
status: pending
title: Create migration 0003_social_rls.sql
type: infra
complexity: medium
dependencies: []
---

# Create migration 0003_social_rls.sql

## Overview

Create a database migration to update RLS policies for social features: allow all authenticated users to read predictions and profiles, and create a match_predictions view for efficient social display.

<critical>
Read TechSpec "Row Level Security" and "Data Models" sections before starting.
- Focus on RLS changes and view creation only.
- Do NOT modify write policies — users must still only edit their own predictions.
- Migration must be idempotent.
- Tests are required.
</critical>

<requirements>
1. MUST drop existing `profiles_read_own` policy and create `profiles_read_all`.
2. MUST drop existing `predictions_read_own` policy and create `predictions_read_all`.
3. MUST create `match_predictions` view joining predictions with profiles.
4. MUST use `CREATE OR REPLACE VIEW` for idempotency.
5. MUST NOT modify insert/update/delete policies.
6. MUST store migration in `supabase/migrations/0003_social_rls.sql`.
7. SHOULD verify migration applies cleanly to existing schema.
</requirements>

## Subtasks

- [ ] Create supabase/migrations/0003_social_rls.sql.
- [ ] Drop and recreate profiles read policy.
- [ ] Drop and recreate predictions read policy.
- [ ] Create match_predictions view.
- [ ] Verify migration applies without errors.

## Implementation Details

Files to create:
- `supabase/migrations/0003_social_rls.sql` — full migration.

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` — original RLS policies.

### Dependent Files
- `src/hooks/useMatchPredictions.js` — will query the new view.
- `src/hooks/useMatches.js` — will benefit from relaxed RLS.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- Migration file created and applies cleanly.
- RLS policies updated for social features.
- match_predictions view queryable.

## Tests

### Unit Tests
- [ ] Migration is idempotent — running twice produces no errors.
- [ ] `profiles_read_all` policy exists and allows authenticated reads.
- [ ] `predictions_read_all` policy exists and allows authenticated reads.
- [ ] `match_predictions` view exists with correct columns.

### Integration Tests
- [ ] Authenticated user can read all profiles.
- [ ] Authenticated user can read all predictions.
- [ ] Authenticated user CANNOT insert/update another user's prediction.
- [ ] match_predictions view returns predictions with user profile data.

## Success Criteria

- Migration applies cleanly.
- Social RLS policies work correctly.
- match_predictions view returns expected data.
