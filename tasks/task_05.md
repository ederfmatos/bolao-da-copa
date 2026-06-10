---
status: pending
title: Football provider interface + football-data.org
type: backend
complexity: medium
dependencies: [task_01]
---

## Overview

Define the `FootballProvider` TypeScript interface and implement the first concrete provider using football-data.org. This establishes the extensible abstraction that all data sync logic depends on.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Core Interfaces — Football Data Provider" for the exact interface definition.
- Focus on the interface contract and the football-data.org implementation — not the fallback chain.
- Minimize HTTP logic; use native fetch available in Deno (Edge Functions runtime).
- Tests are required.
</critical>

<requirements>
1. MUST define the `FootballProvider` interface and `MatchResult` type exactly as specified in TechSpec "Core Interfaces".
2. MUST implement `FootballDataOrgProvider` that fetches all 2026 World Cup matches from football-data.org.
3. MUST map the API response to the `MatchResult` type (id, homeTeam, awayTeam, kickoffAt, status, homeScore, awayScore).
4. MUST read the API key from the `FOOTBALL_DATA_API_KEY` environment variable — never hardcode.
5. MUST map football-data.org status values to the internal `'scheduled' | 'live' | 'finished'` enum.
6. MUST handle HTTP errors (non-2xx) by throwing a descriptive error so the fallback chain can catch it.
7. SHOULD validate that the fixture list covers all expected World Cup matches (64 matches).
</requirements>

## Subtasks

- [ ] Create `supabase/functions/sync-matches/providers/types.ts` with `MatchResult` and `FootballProvider` interface.
- [ ] Create `supabase/functions/sync-matches/providers/footballDataOrg.ts` implementing `FootballProvider`.
- [ ] Map football-data.org match statuses to internal enum values.
- [ ] Handle pagination if the API returns results in pages.
- [ ] Write unit tests with mocked HTTP responses.

## Implementation Details

Files to create:
- `supabase/functions/sync-matches/providers/types.ts`
- `supabase/functions/sync-matches/providers/footballDataOrg.ts`

Reference TechSpec "Core Interfaces" for the exact `FootballProvider` interface and `MatchResult` shape.

### Relevant Files
- `supabase/functions/sync-matches/index.ts` — will import and use this provider (task_07).

### Dependent Files
- `supabase/functions/sync-matches/providers/apiFootball.ts` — will implement the same interface (task_06).
- `supabase/functions/sync-matches/index.ts` — will call `fetchWithFallback([...providers])` (task_07).

### Related ADRs
- ADR-003: Multi-provider com fallback para dados de futebol.

## Deliverables

- `types.ts` defining `MatchResult` and `FootballProvider`.
- `footballDataOrg.ts` implementing `FootballProvider`.
- All unit tests passing.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `FootballDataOrgProvider.fetchMatches()` with a mocked 200 response returns correctly mapped `MatchResult[]`.
- [ ] Status mapping: `'SCHEDULED'` → `'scheduled'`, `'IN_PLAY'` → `'live'`, `'FINISHED'` → `'finished'`.
- [ ] `fetchMatches()` with a mocked 401 response throws an error (allowing fallback).
- [ ] `fetchMatches()` with a mocked 429 (rate limit) response throws an error.
- [ ] `fetchMatches()` returns an empty array when the API returns an empty fixtures list (triggering fallback).
- [ ] API key is read from env variable; missing key throws a descriptive error before making HTTP call.

### Integration Tests
- [ ] Live call to football-data.org sandbox/test endpoint returns at least one `MatchResult` with all required fields populated.

## Success Criteria

- `FootballProvider` interface defined and exportable.
- `FootballDataOrgProvider` passes all unit tests with mocked responses.
- Live integration test returns valid data.
- Test coverage >= 80%.
