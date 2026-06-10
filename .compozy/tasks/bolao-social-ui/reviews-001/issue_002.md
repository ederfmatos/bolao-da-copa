---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: tailwind.config.js
line: 14
severity: high
author: opencode
provider_ref:
---

# Issue 002: Cores Tailwind ausentes causam estilos inválidos

## Review Comment

O arquivo `tailwind.config.js` define apenas `accent.blue`, `accent.orange` e `accent.red`:
```js
accent: {
  blue: '#3b82f6',
  orange: '#f97316',
  red: '#ef4444',
},
```

Porém, no `Rules.jsx` (linhas 39-40), são usadas classes que não existem:
```jsx
{ border: 'border-l-accent-orange', text: 'text-accent-orange' },
{ border: 'border-l-accent-red', text: 'text-accent-red' },
```

Essas classes não são geradas pelo Tailwind porque:
1. `accent.orange` e `accent.red` existem no config, mas as classes `border-l-accent-orange` e `border-l-accent-red` não são padrão (border-l requer configuração adicional)
2. Não há `primary.100`, `primary.200`, etc. definidos, mas são usados em vários componentes

**Impacto**: Estilos não serão aplicados corretamente, resultando em UI inconsistente.

**Sugestão de correção**: 
1. Expandir o tailwind.config.js com todas as cores necessárias
2. Ou usar classes inline com valores arbitrários: `border-l-[#f97316]`
3. Validar todas as classes Tailwind usadas no código contra o config

## Triage

**Claim 1: `border-l-accent-orange` / `border-l-accent-red` won't work**
❌ **Invalid.** In Tailwind v3, any color under `theme.extend.colors` automatically generates all utility variants (`text-`, `bg-`, `border-`, `border-l-`, `border-r-`, etc.) without extra configuration. Since `accent.orange` and `accent.red` exist, classes like `border-l-accent-orange`, `text-accent-orange`, etc. work correctly.

**Claim 2: `primary.100`, `primary.200`, etc. are missing**
⚠️ **Partially valid.** Only `border-primary-200` is actually used (in `PredictionRow.jsx:13`) and missing from the config (only `50, 500, 600, 700` defined). `primary.100` is not used anywhere. The scoped concern is narrower than the issue states.

**Fixes applied:**
1. Added `200: '#bbf7d0'` to `primary` colors in `tailwind.config.js` (Tailwind green-200, matching the existing green palette).

**No test changes needed:** purely a config addition; no behavior change.
