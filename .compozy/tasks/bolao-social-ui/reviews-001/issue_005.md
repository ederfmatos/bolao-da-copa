---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/pages/MatchDetails.jsx
line: 60
severity: medium
author: opencode
provider_ref:
---

# Issue 005: Cálculos de tempo em MatchDetails são re-executados em cada render

## Review Comment

No `MatchDetails.jsx`, os cálculos de deadline são feitos em cada render:
```jsx
const now = new Date()
const kickoffTime = match ? new Date(match.kickoff_at) : null
const oneHourBefore = kickoffTime ? new Date(kickoffTime.getTime() - 60 * 60 * 1000) : null
const threeHoursBefore = kickoffTime ? new Date(kickoffTime.getTime() - 3 * 60 * 60 * 1000) : null

const isFinished = match?.status === 'finished'
const isLive = match?.status === 'live'
const isDeadlinePassed = oneHourBefore && now >= oneHourBefore
const isEditable = !isFinished && !isLive && !isDeadlinePassed
const isWithinThreeHours = threeHoursBefore && now >= threeHoursBefore && !isDeadlinePassed && !isLive && !isFinished
```

**Problemas**:
1. `new Date()` é chamado em cada render, o que pode causar inconsistências se o componente re-renderizar rapidamente
2. Os cálculos são re-feitos mesmo quando `match` não mudou
3. Não há memoização, impactando performance em re-renders frequentes

**Sugestão de correção**:
```jsx
const matchTimes = useMemo(() => {
  if (!match) return null
  
  const kickoffTime = new Date(match.kickoff_at)
  const oneHourBefore = new Date(kickoffTime.getTime() - 60 * 60 * 1000)
  const threeHoursBefore = new Date(kickoffTime.getTime() - 3 * 60 * 60 * 1000)
  
  return { kickoffTime, oneHourBefore, threeHoursBefore }
}, [match])

const now = useMemo(() => new Date(), [])

const isFinished = match?.status === 'finished'
const isLive = match?.status === 'live'
const isDeadlinePassed = matchTimes && now >= matchTimes.oneHourBefore
const isEditable = !isFinished && !isLive && !isDeadlinePassed
const isWithinThreeHours = matchTimes && now >= matchTimes.threeHoursBefore && !isDeadlinePassed && !isLive && !isFinished
```

**Impacto**: Performance degradada em componentes que re-renderizam frequentemente.

## Triage

- Decision: `valid`
- Notes: Time calculations at lines 60-69 were recomputed on every render with no memoization. Fixed by wrapping match-dependent calculations in `useMemo([match])` and `now` in `useMemo([])`. The fix is idiomatic React, low-risk, and all 18 existing tests pass.
