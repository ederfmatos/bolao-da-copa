---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/pages/MatchDetails.jsx
line: 71
severity: low
author: opencode
provider_ref:
---

# Issue 008: otherPredictions pode crashar se user for null

## Review Comment

No `MatchDetails.jsx`, a linha 71 filtra as predições:
```jsx
const otherPredictions = allPredictions.filter((p) => p.user_id !== user?.id)
```

**Problemas**:
1. Se `user` for `null` (usuário não autenticado), `user?.id` será `undefined`
2. O filtro funcionará, mas logicamente está errado - se não há usuário, não deveria haver "other predictions"
3. O componente está dentro de `ProtectedRoute`, então `user` nunca deveria ser `null`, mas a verificação é defensiva

**Sugestão de correção**:
```jsx
const otherPredictions = user 
  ? allPredictions.filter((p) => p.user_id !== user.id)
  : []
```

Ou adicionar um early return se `user` for null:
```jsx
if (!user) {
  return <div>Usuário não autenticado</div>
}
```

**Impacto**: Potencial crash em cenários edge case.

## Triage

- Decision: `VALID`
- Root cause: `allPredictions.filter((p) => p.user_id !== user?.id)` — if `user` is null, `user?.id` is `undefined`, and no DB `user_id` will be `undefined`, so ALL predictions are incorrectly included as "other predictions"
- Fix: Guard the filter with a conditional — return `[]` when `user` is null
- Code change: `src/pages/MatchDetails.jsx:78` — replaced `allPredictions.filter((p) => p.user_id !== user?.id)` with a ternary that returns `[]` when user is null, otherwise filters normally
