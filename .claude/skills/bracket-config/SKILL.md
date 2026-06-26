---
name: bracket-config
description: Configura confrontos do mata-mata (bracket) do bolão. Aceita slot em qualquer formato (R32 01, oitavas jogo 3, quartas 2, semifinal 1, final) e os nomes das seleções, e atualiza home_team, away_team, home_flag e away_flag no Supabase.
---

# /bracket-config

Atualiza um ou mais confrontos do mata-mata no banco Supabase do bolão.

## Como usar

```
/bracket-config R32 04, Países Baixos x Marrocos
/bracket-config oitavas jogo 3, Brasil x Argentina
/bracket-config quartas 2, França x Alemanha
/bracket-config semifinal 1, Portugal x Espanha
/bracket-config final, Brasil x Argentina
/bracket-config terceiro lugar, Alemanha x França
```

Pode passar vários de uma vez, separados por linha ou ponto-e-vírgula.

## Mapeamento de fase → slot

| Input do usuário | Slot no banco |
|---|---|
| R32, 16 avos, fase 1 | R32_NN |
| R16, oitavas, oitavas de final | R16_NN |
| R08, QF, quartas, quartas de final | QF_NN |
| R04, SF, semi, semifinal | SF_NN |
| final | FINAL |
| terceiro lugar, 3rd, 3º lugar | 3RD |

O número do jogo (`NN`) deve ser zero-padded com 2 dígitos (01, 02...).

## Flags das seleções

As flags estão no array `TEAMS` em `src/lib/bracketData.js`. Antes de atualizar, leia esse arquivo para obter a flag correta de cada seleção pelo campo `name`. Se o nome não bater exatamente, tente variações (ex: "Holanda" → "Países Baixos").

## Passos de execução

1. **Interpretar** o slot e as seleções a partir do input do usuário
2. **Ler** `src/lib/bracketData.js` para obter as flags de `home_team` e `away_team` (campo `flag` no array `TEAMS`). Para "TBD" use `null`.
3. **Montar** o payload: `{ home_team, away_team, home_flag, away_flag }`
4. **Chamar** a API REST do Supabase via `curl PATCH`:

```bash
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZXhodW5teHR1bWtwanRkZWptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTEwMTc1MiwiZXhwIjoyMDk2Njc3NzUyfQ.QEJosXhmKz2204YjAqfWCH0E4c7yBOtcHRAcy6OAVwI"

curl -s -X PATCH \
  "https://aaexhunmxtumkpjtdejm.supabase.co/rest/v1/matches?bracket_slot=eq.SLOT" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"home_team":"...","away_team":"...","home_flag":"...","away_flag":"..."}'
```

5. **Verificar** fazendo um GET para confirmar a atualização:

```bash
curl -s \
  "https://aaexhunmxtumkpjtdejm.supabase.co/rest/v1/matches?bracket_slot=eq.SLOT&select=bracket_slot,home_team,home_flag,away_team,away_flag" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" | jq .
```

6. **Reportar** os slots atualizados com time e flag confirmados.

## Observações

- Nunca altere `kickoff_at`, `status`, `home_score`, `away_score` — apenas os campos de time e flag.
- "TBD" deve ser salvo como string `"TBD"` com `away_flag: null`.
- Se o usuário informar só um time (ex: "Brasil x TBD"), salve o TBD normalmente.
- Se o time não existir no array TEAMS, avise o usuário e peça confirmação antes de salvar sem flag.
