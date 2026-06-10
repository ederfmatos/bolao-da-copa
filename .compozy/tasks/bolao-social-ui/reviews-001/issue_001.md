---
provider: manual
pr:
round: 1
round_created_at: 2026-06-10T18:00:00Z
status: resolved
file: src/pages/MatchDetails.jsx
line: 140
severity: high
author: opencode
provider_ref:
---

# Issue 001: Inconsistência no tratamento de flags entre MatchCard e MatchDetails

## Review Comment

No componente `MatchCard.jsx` (linhas 63-67), as flags são renderizadas como texto/emoji:
```jsx
<div className="font-bold mb-1">
  {match.home_flag} {match.home_team}
</div>
```

Porém, no `MatchDetails.jsx` (linhas 140, 147), as flags são tratadas como URLs de imagem:
```jsx
{match.home_flag && (
  <img src={match.home_flag} alt="" className="w-6 h-6 object-contain" />
)}
```

Segundo o schema original (`0001_initial_schema.sql`), o campo `home_flag` é do tipo `TEXT` e foi populado com emojis no seed.sql (ex: '🇲🇽', '🇿🇦').

**Impacto**: As bandeiras não aparecerão corretamente na tela de detalhes da partida, pois `img src` espera uma URL, não um emoji.

**Sugestão de correção**: Padronizar o tratamento das flags. Opções:
1. Renderizar como emoji em ambos os componentes
2. Converter para URLs de imagens de bandeiras (ex: flagcdn.com)
3. Usar um componente de bandeira que suporte ambos os formatos

## Triage

- Decision: `VALID`
- Notes: O campo home_flag/away_flag é TEXT populado com emojis (ex: '🇲🇽') conforme schema e seed.sql. MatchCard.jsx renderiza corretamente como texto, mas MatchDetails.jsx usa `<img src={...}>` que não funciona com emojis. Correção: substituir `<img>` por renderização como texto, padronizando com MatchCard.
