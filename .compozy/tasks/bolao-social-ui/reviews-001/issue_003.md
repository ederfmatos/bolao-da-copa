---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/context/ThemeContext.jsx
line: 6
severity: medium
author: opencode
provider_ref:
---

# Issue 003: ThemeContext acessa window no initializer sem proteção

## Review Comment

O `ThemeContext.jsx` acessa `window.matchMedia` e `localStorage` diretamente no initializer do `useState`:
```jsx
const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem('theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
})
```

**Problemas**:
1. Se este código for executado em ambiente SSR (Server-Side Rendering), `window` e `localStorage` não existem, causando erro
2. Não há validação do valor armazenado em `localStorage` - se alguém modificar manualmente para um valor inválido (ex: "blue"), o sistema quebrará
3. Testes unitários podem falhar se não mockarem `window` e `localStorage`

**Sugestão de correção**:
```jsx
const [theme, setTheme] = useState(() => {
  if (typeof window === 'undefined') return 'light'
  
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') return saved
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
})
```

## Triage

- Decision: `VALID`
- Notes:
  - ThemeContext accesses `window.matchMedia` and `localStorage` in `useState` initializer without SSR guard
  - No validation of stored localStorage value — invalid values like "blue" would be accepted and break UI
  - Fix: added `typeof window === 'undefined'` guard returning `'light'` as default, and changed `if (saved)` to `if (saved === 'dark' || saved === 'light')` for validation
  - Added tests for SSR scenario and invalid localStorage value
