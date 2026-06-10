---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/components/LeaderboardRow.jsx
line: 14
severity: low
author: opencode
provider_ref:
---

# Issue 007: Uso de placeholder.com pode falhar em produção

## Review Comment

O componente `LeaderboardRow.jsx` usa `placeholder.com` como fallback para avatares:
```jsx
<img
  src={entry.avatar_url || 'https://via.placeholder.com/40'}
  alt={entry.name}
  className="w-10 h-10 rounded-full mr-4 object-cover shrink-0"
/>
```

**Problemas**:
1. `placeholder.com` é um serviço externo que pode estar indisponível
2. Adiciona dependência de serviço terceiro
3. Pode ser bloqueado por ad blockers ou firewalls corporativos
4. O mesmo problema existe em `Podium.jsx` (linha 31)

**Sugestão de correção**:
1. Criar um componente de avatar com fallback SVG inline:
```jsx
function Avatar({ src, name, size = 40 }) {
  const [error, setError] = useState(false)
  
  if (!src || error) {
    return (
      <div 
        className="bg-gray-300 dark:bg-gray-600 flex items-center justify-center rounded-full font-bold text-gray-600 dark:text-gray-300"
        style={{ width: size, height: size }}
      >
        {name?.charAt(0).toUpperCase() || '?'}
      </div>
    )
  }
  
  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}
```

2. Ou usar um avatar generator local (ex: DiceBear, UI Avatars)

**Impacto**: Avatares podem não carregar se o serviço externo estiver indisponível.

## Triage

- Decision: `VALID`
- Root cause: `LeaderboardRow.jsx` and `Podium.jsx` use `https://via.placeholder.com/40` and `https://via.placeholder.com/60` respectively as fallback URLs for missing avatars. This adds an external service dependency that may be unavailable, slow, or blocked by ad-blockers/corporate firewalls.
- Fix approach:
  1. Create a shared `Avatar` component (`src/components/Avatar.jsx`) that renders an `<img>` when a valid `src` is provided, and a Tailwind-styled `<div>` with the user's initial letter as fallback when `src` is null/undefined or the image fails to load (via `onError`). No inline styles — uses Tailwind classes exclusively to avoid breaking existing "renders without inline styles" test assertions.
  2. Update `LeaderboardRow.jsx` to use the new `Avatar` component with `className="w-10 h-10 mr-4"`.
  3. Update `LeaderboardRow.test.jsx` — replace the test that checked for `via.placeholder.com` with one that checks for the initial letter fallback. Keep the test that verifies a provided URL renders as `<img>`.
  4. Create `Avatar.test.jsx` covering: renders fallback when no src, renders img when src provided, shows initial letter, shows '?' when no name, switches to fallback on image error.
  5. Note: `Podium.jsx` has the same issue but is outside the batch scope (not listed in `<batch_scope>` code files). The `Avatar` component is designed to be reused there in a separate fix.
