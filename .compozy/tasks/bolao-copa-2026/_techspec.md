# Bolão Copa 2026 — Technical Specification

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                      │
│  React SPA + Vite                                        │
│  src/ → pages, components, hooks, lib                    │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS (Supabase JS Client)
               ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase Platform                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │   Auth    │  │ Postgres  │  │   Edge Functions      │ │
│  │  (Google  │  │ (tables,  │  │   sync-matches        │ │
│  │   OAuth)  │  │  RLS,     │  │   (Deno, cron 5min)   │ │
│  │          │  │  views)   │  │                       │ │
│  └──────────┘  └──────────┘  └───────────┬───────────┘ │
│                                           │              │
│  ┌──────────────────────────────┐        │              │
│  │  Realtime                     │        │              │
│  │  (predictions table)         │        │              │
│  └──────────────────────────────┘        │              │
└──────────────────────────────────────────┼──────────────┘
                                           │ HTTPS
                          ┌────────────────┼────────────────┐
                          ▼                ▼                 │
                   football-data.org   API-Football          │
                   (primary)         (fallback/RapidAPI)     │
                   └────────────────────────────────────────┘
```

## 2. Data Models

### 2.1 `profiles` table

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 `matches` table

```sql
CREATE TABLE matches (
  id           TEXT PRIMARY KEY,           -- external fixture ID from provider
  home_team    TEXT NOT NULL,
  away_team    TEXT NOT NULL,
  home_flag    TEXT,                       -- emoji or country code
  away_flag    TEXT,
  group_name   TEXT,                       -- e.g. "Group A", "Round of 16"
  kickoff_at   TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score   SMALLINT CHECK (home_score >= 0),
  away_score   SMALLINT CHECK (away_score >= 0),
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_kickoff ON matches (kickoff_at);
CREATE INDEX idx_matches_status ON matches (status);
```

### 2.3 `predictions` table

```sql
CREATE TABLE predictions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id    TEXT NOT NULL REFERENCES matches(id),
  home_score  SMALLINT NOT NULL CHECK (home_score >= 0),
  away_score  SMALLINT NOT NULL CHECK (away_score >= 0),
  points      SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX idx_predictions_user ON predictions (user_id);
CREATE INDEX idx_predictions_match ON predictions (match_id);
```

### 2.4 `leaderboard` view

```sql
CREATE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COUNT(pr.id) AS total_predictions
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY total_points DESC;
```

## 3. Row Level Security (RLS)

### 3.1 `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3.2 `matches`

```sql
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_read_all" ON matches
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 3.3 `predictions`

```sql
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "predictions_read_own" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "predictions_insert_own" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "predictions_update_own" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "predictions_before_deadline" ON predictions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now() + INTERVAL '1 hour'
    )
  );

CREATE POLICY "predictions_update_before_deadline" ON predictions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now() + INTERVAL '1 hour'
    )
  );
```

### 3.4 `leaderboard`

```sql
-- View inherits RLS from underlying tables; no additional policy needed.
-- All authenticated users can see the full leaderboard.
```

## 4. Triggers

### 4.1 Auto-create profile on sign-up

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 5. Core Interfaces

### 5.1 Football Data Provider

```typescript
// supabase/functions/sync-matches/providers/types.ts

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface MatchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  groupName: string;
  kickoffAt: string; // ISO 8601
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
}

export interface FootballProvider {
  name: string;
  fetchMatches(): Promise<MatchResult[]>;
}
```

### 5.2 Fallback Chain

```typescript
// supabase/functions/sync-matches/providers/index.ts

export async function fetchWithFallback(
  providers: FootballProvider[]
): Promise<MatchResult[]> {
  for (const provider of providers) {
    try {
      const results = await provider.fetchMatches();
      if (results.length > 0) return results;
      console.warn(`Provider ${provider.name} returned empty results`);
    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error.message);
    }
  }
  throw new Error('All football data providers failed');
}

export const defaultChain: FootballProvider[] = [
  footballDataOrgProvider,
  apiFootballProvider,
];
```

### 5.3 Points Calculation

```typescript
// supabase/functions/_shared/calculatePoints.ts

export function calculatePoints(
  predicted: { home: number; away: number },
  actual: { home: number; away: number }
): number {
  // Exact score
  if (predicted.home === actual.home && predicted.away === actual.away) {
    return 10;
  }

  const predictedDiff = predicted.home - predicted.away;
  const actualDiff = actual.home - actual.away;
  const predictedWinner = Math.sign(predictedDiff);
  const actualWinner = Math.sign(actualDiff);

  // Correct draw (wrong score)
  if (predictedWinner === 0 && actualWinner === 0) {
    return 7;
  }

  // Correct winner + correct goal difference
  if (predictedWinner === actualWinner && predictedDiff === actualDiff) {
    return 7;
  }

  // Correct winner only
  if (predictedWinner === actualWinner) {
    return 3;
  }

  // Wrong result
  return 0;
}
```

## 6. API & Integration Design

### 6.1 Edge Function: `sync-matches`

**Runtime**: Deno (Supabase Edge Functions)
**Schedule**: Every 5 minutes via `pg_cron`
**Trigger**: Also callable via HTTP POST for manual initial load

**Logic**:
1. Call `fetchWithFallback(defaultChain)` to get all matches.
2. For each match, upsert into `matches` table using `onConflict: 'id'`.
3. Detect status transitions: compare fetched status vs. current DB status.
4. Collect list of newly-finished match IDs (status changed to `'finished'` this cycle).
5. For each newly-finished match:
   a. Fetch all predictions for that match.
   b. Call `calculatePoints(predicted, actual)` for each prediction.
   c. Bulk-update `predictions.points` for all affected rows.
6. Log summary: total matches upserted, newly-finished count, predictions updated.
7. Return 200 with summary or 500 on total failure.

**Secrets** (set via `supabase secrets set`):
- `SUPABASE_SERVICE_ROLE_KEY`
- `FOOTBALL_DATA_API_KEY`
- `API_FOOTBALL_KEY`

### 6.2 Realtime Subscription

```typescript
// src/hooks/useLeaderboard.js

const channel = supabase
  .channel('leaderboard-updates')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'predictions', filter: 'points=neq.0' },
    () => { refetchLeaderboard(); }
  )
  .subscribe();

// Cleanup on unmount:
return () => { supabase.removeChannel(channel); };
```

### 6.3 Frontend API Calls

All frontend data access goes through the Supabase JS client. No custom REST API.

| Operation | Method | Table/View | Notes |
|-----------|--------|------------|-------|
| List matches | `select` | `matches` | Ordered by `kickoff_at` |
| Get predictions | `select` | `predictions` | Filtered by `user_id` |
| Save prediction | `upsert` | `predictions` | `onConflict: 'user_id, match_id'` |
| Get leaderboard | `select` | `leaderboard` | Ordered by `total_points DESC` |

## 7. Frontend Architecture

### 7.1 Folder Structure

```
src/
  main.jsx
  App.jsx                    -- React Router setup
  lib/
    supabase.js              -- Supabase client singleton
  hooks/
    useAuth.js               -- Auth state + signInWithGoogle + signOut
    useMatches.js            -- Fetch matches, group by status
    usePredictions.js        -- Fetch/save predictions
    useLeaderboard.js        -- Fetch leaderboard + Realtime subscription
  pages/
    Login.jsx                -- Google sign-in button
    Home.jsx                 -- Redirect to /matches
    Matches.jsx              -- Match list grouped by status
    Predict.jsx              -- Score prediction for a single match
    Leaderboard.jsx          -- Rankings + Podium
    Rules.jsx                -- Static scoring rules
  components/
    ProtectedRoute.jsx       -- Auth gate for routes
    MatchCard.jsx            -- Single match display card
    ScorePicker.jsx          -- +/− score input controls
    LeaderboardRow.jsx       -- Single leaderboard entry
    Podium.jsx               -- Top 3 highlight
```

### 7.2 Routing

| Path | Component | Auth |
|------|-----------|------|
| `/` | `Login.jsx` | Public |
| `/matches` | `Matches.jsx` | Protected |
| `/predict/:matchId` | `Predict.jsx` | Protected |
| `/leaderboard` | `Leaderboard.jsx` | Protected |
| `/rules` | `Rules.jsx` | Protected |

### 7.3 useAuth Hook

```javascript
// src/hooks/useAuth.js

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () => {
    supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = () => {
    supabase.auth.signOut();
  };

  return { user, session, signInWithGoogle, signOut, loading };
}
```

## 8. Environment Variables

### 8.1 Frontend (Vercel)

| Variable | Source | Description |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard | Public anon key |

### 8.2 Edge Functions (Supabase Secrets)

| Variable | Source | Description |
|----------|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Service role key (DB writes) |
| `FOOTBALL_DATA_API_KEY` | football-data.org | Primary provider API key |
| `API_FOOTBALL_KEY` | RapidAPI | Fallback provider API key |

## 9. Database Migrations

| File | Purpose |
|------|---------|
| `supabase/migrations/0001_initial_schema.sql` | Tables, view, RLS, trigger |
| `supabase/migrations/0002_cron_schedule.sql` | `pg_cron` job for sync-matches |

## 10. Development Sequencing

1. Supabase project setup + schema (task_01)
2. Google OAuth config (task_02)
3. Vite + React scaffold (task_03)
4. Auth flow (task_04)
5. Football provider interface + football-data.org (task_05)
6. API-Football provider + fallback chain (task_06)
7. sync-matches Edge Function + cron (task_07)
8. Points calculation utility (task_08)
9. Match list page (task_09)
10. Score prediction (task_10)
11. Points assignment (task_11)
12. Leaderboard + Realtime (task_12)
13. Rules page (task_13)
14. Deploy to Vercel (task_14)
