---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/components/BottomNavigation.jsx
line: 32
severity: low
author: opencode
provider_ref:
---

# Issue 006: Botão de tema sem aria-label prejudica acessibilidade

## Review Comment

O botão de alternância de tema no `BottomNavigation.jsx` não possui `aria-label`:
```jsx
<button
  onClick={toggleTheme}
  className="flex flex-col items-center justify-center w-full h-full text-xs text-gray-500 dark:text-dark-muted"
>
  <span className="text-xl mb-1">{theme === 'dark' ? '☀️' : '🌙'}</span>
  <span>Tema</span>
</button>
```

**Problemas**:
1. Leitores de tela não conseguem identificar a função do botão
2. O texto "Tema" é visível, mas não é semanticamente ligado ao botão
3. Viola WCAG 2.1 Level A (1.3.1 Info and Relationships)

**Sugestão de correção**:
```jsx
<button
  onClick={toggleTheme}
  aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
  className="flex flex-col items-center justify-center w-full h-full text-xs text-gray-500 dark:text-dark-muted"
>
  <span className="text-xl mb-1">{theme === 'dark' ? '☀️' : '🌙'}</span>
  <span aria-hidden="true">Tema</span>
</button>
```

**Impacto**: Usuários de leitores de tela não conseguem alternar o tema.

## Triage

- Decision: `VALID`
- Root cause: Button element has no `aria-label`, so its purpose (toggle theme) is not exposed to assistive technologies.
- Fix approach: Add `aria-label` with dynamic text based on current theme, and set `aria-hidden="true"` on the visible `<span>Tema</span>` since the `aria-label` already conveys the purpose to screen readers.
