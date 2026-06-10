---
status: pending
title: API-Football provider + fallback chain
type: backend
complexity: medium
dependencies: [task_05]
---

## Overview

Implement the `ApiFootballProvider` (RapidAPI) as the second football data provider and wire up the `fetchWithFallback` chain function that tries providers in order and returns the first successful result.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Core Interfaces — Football Data Provider" for the `fetchWithFallback` function signature.
- Focus on the fallback chain logic and the API-Football implementation — not the cron trigger.
- Adding a new provider must require only implementing the interface and appending to the chain array.
- Tests are required.
</critical>

<requirements>
1. MUST implement `ApiFootballProvider` conforming to the `FootballProvider` interface from task_05.
2. MUST read the API key from the `API_FOOTBALL_KEY` environment variable.
3. MUST map API-Football response fields to the shared `MatchResult` type.
4. MUST implement `fetchWithFallback(providers: FootballProvider[]): Promise<MatchResult[]>` exactly as defined in TechSpec.
5. MUST log a warning (not throw) when a provider fails, then continue to the next provider.
6. MUST throw only when ALL providers have failed.
7. SHOULD export a pre-configured default chain array `[footballDataOrgProvider, apiFootballProvider]` for use by the cron function.
</requirements>

## Subtasks

- [ ] Create `supabase/functions/sync-matches/providers/apiFootball.ts` implementing `FootballProvider`.
- [ ] Map API-Football response fields and statuses to `MatchResult`.
- [ ] Implement `fetchWithFallback` in `supabase/functions/sync-matches/providers/index.ts`.
- [ ] Export default provider chain array.
- [ ] Write unit tests covering fallback scenarios.

## Implementation Details

Files to create:
- `supabase/functions/sync-matches/providers/apiFootball.ts`
- `supabase/functions/sync-matches/providers/index.ts` — exports `fetchWithFallback` and default chain.

Reference TechSpec "Core Interfaces" for the `fetchWithFallback` implementation pattern.

### Relevant Files
- `supabase/functions/sync-matches/providers/types.ts` (task_05)
- `supabase/functions/sync-matches/providers/footballDataOrg.ts` (task_05)

### Dependent Files
- `supabase/functions/sync-matches/index.ts` — imports `fetchWithFallback` and default chain (task_07).

### Related ADRs
- ADR-003: Multi-provider com fallback para dados de futebol.

## Deliverables

- `apiFootball.ts` implementing `FootballProvider`.
- `providers/index.ts` with `fetchWithFallback` and default chain.
- All unit tests passing.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `fetchWithFallback` returns results from the first provider when it succeeds.
- [ ] `fetchWithFallback` skips to second provider when the first throws an error.
- [ ] `fetchWithFallback` skips to second provider when the first returns an empty array.
- [ ] `fetchWithFallback` throws when all providers fail.
- [ ] `fetchWithFallback` throws when all providers return empty arrays.
- [ ] Warning is logged (not thrown) for each failed provider.
- [ ] `ApiFootballProvider.fetchMatches()` with a mocked 200 response returns correctly mapped `MatchResult[]`.
- [ ] `ApiFootballProvider.fetchMatches()` with a mocked 403 response throws an error.

### Integration Tests
- [ ] Default chain with both providers mocked: first provider failure causes second provider to be called.
- [ ] Default chain with both providers mocked: first provider success prevents second provider from being called.

## Success Criteria

- Fallback chain works correctly under all failure combinations.
- Adding a third provider requires only implementing `FootballProvider` and appending to the chain array.
- All tests pass.
- Test coverage >= 80%.
