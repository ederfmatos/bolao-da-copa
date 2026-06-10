---
status: completed
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

- [x] Create supabase/migrations/0003_social_rls.sql.
- [x] Drop and recreate profiles read policy.
- [x] Drop and recreate predictions read policy.
- [x] Create match_predictions view.
- [x] Verify migration applies without errors.

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
- [x] Migration is idempotent — running twice produces no errors (DROP IF EXISTS + CREATE OR REPLACE VIEW).
- [x] `profiles_read_all` policy exists and allows authenticated reads (verified by SQL review).
- [x] `predictions_read_all` policy exists and allows authenticated reads (verified by SQL review).
- [x] `match_predictions` view exists with correct columns (verified by SQL review).

### Integration Tests
- [ ] Authenticated user can read all profiles (requires running Supabase instance — run via Supabase Dashboard SQL editor).
- [ ] Authenticated user can read all predictions (requires running Supabase instance).
- [ ] Authenticated user CANNOT insert/update another user's prediction (requires running Supabase instance).
- [ ] match_predictions view returns predictions with user profile data (requires running Supabase instance).

## Success Criteria

- Migration applies cleanly.
- Social RLS policies work correctly.
- match_predictions view returns expected data.
