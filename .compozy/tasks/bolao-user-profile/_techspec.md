# Bolão User Profile — Technical Specification

## Executive Summary

Adicionar página de perfil de usuário acessível via `/user/:userId` que exibe informações do perfil, estatísticas resumidas e histórico completo de palpites. A implementação reutiliza componentes existentes (Avatar, PredictionRow) e adiciona uma nova view no banco (`user_predictions`) para buscar predições com dados completos das partidas em uma única query.

**Trade-off principal**: Criar uma view no banco adiciona uma migration, mas centraliza a lógica de join e simplifica o hook, tornando o código mais manutenível e reutilizável.

## System Architecture

### Component Overview

```
App.jsx (nova rota /user/:userId)
  └── UserProfile.jsx (página)
        ├── UserProfileHeader (avatar, nome, pontos, ranking)
        ├── UserStats (estatísticas resumidas)
        └── UserPredictionList (lista cronológica)
              └── UserPredictionRow (palpite individual)

useUserPredictions(userId) → view user_predictions
useLeaderboard() → view leaderboard (para pontos totais e ranking)
```

## Implementation Design

### Core Interfaces

```javascript
// src/hooks/useUserPredictions.js

export function useUserPredictions(userId) {
  // Returns:
  // { predictions: UserPrediction[], loading: boolean, error: string | null }
  
  // UserPrediction shape:
  // {
  //   prediction_id: string,
  //   match_id: string,
  //   predicted_home: number,
  //   predicted_away: number,
  //   points: number,
  //   created_at: string,
  //   home_team: string,
  //   away_team: string,
  //   home_flag: string,
  //   away_flag: string,
  //   group_name: string,
  //   kickoff_at: string,
  //   match_status: 'scheduled' | 'live' | 'finished',
  //   actual_home: number | null,
  //   actual_away: number | null
  // }
}
```

### Data Models

**Nova view: `user_predictions`**

```sql
CREATE OR REPLACE VIEW user_predictions AS
SELECT
  pr.id AS prediction_id,
  pr.user_id,
  pr.match_id,
  pr.home_score AS predicted_home,
  pr.away_score AS predicted_away,
  pr.points,
  pr.created_at,
  m.home_team,
  m.away_team,
  m.home_flag,
  m.away_flag,
  m.group_name,
  m.kickoff_at,
  m.status AS match_status,
  m.home_score AS actual_home,
  m.away_score AS actual_away
FROM predictions pr
JOIN matches m ON m.id = pr.match_id
ORDER BY pr.created_at DESC;
```

**Estatísticas calculadas no frontend:**

```javascript
// Calculadas a partir do array de predictions
const stats = {
  totalPredictions: predictions.length,
  exactScoreCount: predictions.filter(p => p.points === 10).length,
  distribution: {
    10: predictions.filter(p => p.points === 10).length,
    7: predictions.filter(p => p.points === 7).length,
    3: predictions.filter(p => p.points === 3).length,
    0: predictions.filter(p => p.points === 0).length,
  },
  exactScoreRate: (exactScoreCount / totalPredictions * 100).toFixed(1)
}
```

### Frontend API Calls

| Operation | Method | Table/View | Notes |
|-----------|--------|------------|-------|
| Get user predictions | `select` | `user_predictions` | Filtered by `user_id`, ordered by `created_at DESC` |
| Get user profile info | `select` | `leaderboard` | Filtered by `user_id` for total_points and ranking |

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `App.jsx` | Modified | Add new route `/user/:userId` | Add Route component |
| `LeaderboardRow.jsx` | Modified | Make name/avatar clickable | Wrap in Link component |
| `PredictionRow.jsx` | Modified | Make name/avatar clickable | Wrap in Link component |
| `UserProfile.jsx` | New | User profile page | Create component |
| `useUserPredictions.js` | New | Hook to fetch user predictions | Create hook |
| `supabase/migrations/0006_user_predictions_view.sql` | New | Create user_predictions view | Create migration |

## Testing Approach

### Unit Tests

- `useUserPredictions`: test fetching, loading states, error handling
- `UserProfile`: test rendering with different data states (loading, empty, with data)
- `UserStats`: test statistics calculation accuracy
- `UserPredictionRow`: test display for finished vs scheduled matches

### Integration Tests

- Navigation from Leaderboard to UserProfile and back
- Navigation from MatchDetails to UserProfile and back
- Deep linking to `/user/:userId` works correctly

## Development Sequencing

### Build Order

1. **Migration 0006** — Create `user_predictions` view (no dependencies)
2. **Hook `useUserPredictions`** — Fetch data from view (depends on step 1)
3. **Component `UserPredictionRow`** — Display single prediction (no dependencies)
4. **Component `UserStats`** — Display statistics (no dependencies)
5. **Component `UserProfileHeader`** — Display profile info (no dependencies)
6. **Page `UserProfile`** — Assemble components (depends on steps 2-5)
7. **Update `App.jsx`** — Add route (depends on step 6)
8. **Update `LeaderboardRow`** — Add navigation link (depends on step 7)
9. **Update `PredictionRow`** — Add navigation link (depends on step 7)
10. **Build verification** — Test all flows (depends on all steps)

## Architecture Decision Records

- [ADR-001: Página de perfil dedicada para visualização de palpites](adrs/adr-001.md) — Decisão de criar página dedicada em vez de modal/drawer ou expansão inline
- [ADR-002: View `user_predictions` para dados do perfil](adrs/adr-002.md) — Decisão de usar view no banco em vez de query com join ou queries separadas
