# Bolão Social UI — Technical Specification

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                      │
│  React SPA + Vite + Tailwind CSS                         │
│  src/ → pages, components, hooks, lib, context           │
│                                                          │
│  New: ThemeProvider (dark/light mode)                    │
│  New: BottomNavigation component                         │
│  New: MatchDetails page with social predictions          │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS (Supabase JS Client)
               ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase Platform                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │   Auth    │  │ Postgres  │  │   Edge Functions      │ │
│  │  (Google  │  │ (tables,  │  │   sync-matches        │ │
│  │   OAuth)  │  │  RLS,     │  │   (unchanged)         │ │
│  │          │  │  views)   │  │                       │ │
│  └──────────┘  └──────────┘  └───────────────────────┘ │
│                                                          │
│  Changed RLS:                                            │
│  - predictions_read_all (new)                            │
│  - profiles_read_all (new)                               │
└─────────────────────────────────────────────────────────┘
```

## 2. Data Models

### 2.1 Existing Tables (Unchanged)

No schema changes to `profiles`, `matches`, or `predictions` tables. All existing columns and constraints remain the same.

### 2.2 New View: `match_predictions`

A new view to efficiently fetch all predictions for a match with user profile data:

```sql
CREATE VIEW match_predictions AS
SELECT
  pr.id AS prediction_id,
  pr.match_id,
  pr.user_id,
  pr.home_score,
  pr.away_score,
  pr.points,
  pr.created_at,
  pr.updated_at,
  p.name AS user_name,
  p.avatar_url AS user_avatar_url
FROM predictions pr
JOIN profiles p ON p.id = pr.user_id
ORDER BY pr.points DESC, pr.created_at ASC;
```

This view joins predictions with profiles to provide all data needed for the social predictions display in a single query.

## 3. Row Level Security (RLS)

### 3.1 Changes to `profiles`

```sql
-- Replace profiles_read_own with profiles_read_all
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;

CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Keep existing insert policy
-- profiles_insert_own remains unchanged
```

### 3.2 Changes to `predictions`

```sql
-- Replace predictions_read_own with predictions_read_all
DROP POLICY IF EXISTS "predictions_read_own" ON predictions;

CREATE POLICY "predictions_read_all" ON predictions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Keep existing insert/update policies
-- predictions_insert_own, predictions_update_own remain unchanged
-- predictions_before_deadline policies remain unchanged
```

### 3.3 New View: `match_predictions`

```sql
-- View inherits RLS from underlying tables
-- No additional policy needed since both predictions and profiles
-- now allow authenticated users to read all rows
```

## 4. Frontend Architecture

### 4.1 Tailwind CSS Configuration

**Installation**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        accent: {
          blue: '#3b82f6',
          orange: '#f97316',
          red: '#ef4444',
        },
        dark: {
          bg: '#0d0d0d',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e5e5e5',
          muted: '#a3a3a3',
        },
      },
    },
  },
  plugins: [],
}
```

**src/index.css** (new file):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-white text-gray-900 dark:bg-dark-bg dark:text-dark-text;
  }
}
```

### 4.2 Theme Context

**src/context/ThemeContext.jsx**:
```javascript
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

### 4.3 Updated Folder Structure

```
src/
  main.jsx                          -- Wrap App in ThemeProvider
  App.jsx                           -- Routing + BottomNavigation
  index.css                         -- Tailwind directives (NEW)
  context/
    ThemeContext.jsx                 -- Theme provider + hook (NEW)
  lib/
    supabase.js                     -- Unchanged
  hooks/
    useAuth.js                      -- Unchanged
    useMatches.js                   -- Add prediction count query
    usePredictions.js               -- Unchanged (own predictions)
    useMatchPredictions.js          -- NEW: fetch all predictions for a match
    useLeaderboard.js               -- Unchanged
  pages/
    Login.jsx                       -- Tailwind migration
    Home.jsx                        -- Unchanged (redirect)
    Matches.jsx                     -- Tailwind migration + prediction counts
    MatchDetails.jsx                -- NEW: match detail with social predictions
    Predict.jsx                     -- Tailwind migration (merged into MatchDetails)
    Leaderboard.jsx                 -- Tailwind migration
    Rules.jsx                       -- Tailwind migration
  components/
    ProtectedRoute.jsx              -- Unchanged
    BottomNavigation.jsx            -- NEW: bottom nav bar
    ThemeToggle.jsx                 -- NEW: dark/light toggle button
    MatchCard.jsx                   -- Tailwind migration + prediction count
    ScorePicker.jsx                 -- Tailwind migration
    PredictionRow.jsx               -- NEW: single prediction in social list
    LeaderboardRow.jsx              -- Tailwind migration
    Podium.jsx                      -- Tailwind migration
```

### 4.4 Routing Changes

| Path | Component | Auth | Change |
|------|-----------|------|--------|
| `/` | `Login.jsx` | Public | Unchanged |
| `/matches` | `Matches.jsx` | Protected | Tailwind migration |
| `/match/:matchId` | `MatchDetails.jsx` | Protected | **NEW** — replaces `/predict/:matchId` |
| `/leaderboard` | `Leaderboard.jsx` | Protected | Tailwind migration |
| `/rules` | `Rules.jsx` | Protected | Tailwind migration |

Note: The `/predict/:matchId` route is replaced by `/match/:matchId` which combines match info, user prediction (editable), and social predictions in a single screen.

### 4.5 New Hook: `useMatchPredictions`

```javascript
// src/hooks/useMatchPredictions.js

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMatchPredictions(matchId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) return

    async function fetchPredictions() {
      try {
        const { data, error } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('match_id', matchId)
          .order('points', { ascending: false })
          .order('created_at', { ascending: true })

        if (error) throw error
        setPredictions(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [matchId])

  return { predictions, loading, error }
}
```

### 4.6 Updated Hook: `useMatches`

Add prediction count to the matches query:

```javascript
// src/hooks/useMatches.js (updated)

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [predictionCounts, setPredictionCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_at', { ascending: true })

        if (matchesError) throw matchesError

        // Fetch prediction counts per match
        const { data: countsData, error: countsError } = await supabase
          .from('predictions')
          .select('match_id')

        if (!countsError && countsData) {
          const counts = {}
          countsData.forEach(p => {
            counts[p.match_id] = (counts[p.match_id] || 0) + 1
          })
          setPredictionCounts(counts)
        }

        setMatches(matchesData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { matches, predictionCounts, loading, error }
}
```

## 5. Component Specifications

### 5.1 BottomNavigation

```jsx
// src/components/BottomNavigation.jsx

import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'

function BottomNavigation() {
  const { theme, toggleTheme } = useTheme()

  const tabs = [
    { to: '/matches', label: 'Partidas', icon: '⚽' },
    { to: '/leaderboard', label: 'Classificação', icon: '🏆' },
    { to: '/rules', label: 'Regras', icon: '📋' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive
                  ? 'text-primary-600 dark:text-primary-500'
                  : 'text-gray-500 dark:text-dark-muted'
              }`
            }
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center w-full h-full text-xs text-gray-500 dark:text-dark-muted"
        >
          <span className="text-xl mb-1">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>Tema</span>
        </button>
      </div>
    </nav>
  )
}

export default BottomNavigation
```

### 5.2 MatchDetails Page

```jsx
// src/pages/MatchDetails.jsx

// Layout:
// 1. Header: back button + match info (teams, flags, group, time, status)
// 2. User's prediction section (ScorePicker if open, or display-only if closed)
// 3. Social predictions list (all other participants)

// Key behaviors:
// - Fetch match by ID from URL params
// - Fetch all predictions via useMatchPredictions(matchId)
// - Separate user's own prediction from others
// - Show prediction count in header
// - For finished matches, show points next to each prediction
// - Sort others' predictions: by points DESC (finished) or by created_at ASC (scheduled/live)
```

### 5.3 PredictionRow Component

```jsx
// src/components/PredictionRow.jsx

// Props: { prediction, isCurrentUser, isFinished }

// Layout:
// - Avatar (40x40, rounded)
// - Name (bold if current user)
// - Score (home × away)
// - Points badge (only if match finished)

// Styling:
// - Current user row: highlighted with primary-50 bg / dark card border
// - Points badge: green for 10pts, blue for 7pts, orange for 3pts, gray for 0pts
```

### 5.4 MatchCard Updates

```jsx
// src/components/MatchCard.jsx (updated)

// Add prediction count display:
// - Show "X palpites" badge below match info
// - Use predictionCounts from useMatches hook
// - Keep existing "Palpitado" badge for current user
```

## 6. Database Migrations

| File | Purpose |
|------|---------|
| `supabase/migrations/0003_social_rls.sql` | Update RLS for predictions/profiles read-all, create match_predictions view |

### 6.1 Migration Content

```sql
-- 0003_social_rls.sql

-- Update profiles RLS: allow all authenticated users to read
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Update predictions RLS: allow all authenticated users to read
DROP POLICY IF EXISTS "predictions_read_own" ON predictions;
CREATE POLICY "predictions_read_all" ON predictions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create match_predictions view for efficient social display
CREATE OR REPLACE VIEW match_predictions AS
SELECT
  pr.id AS prediction_id,
  pr.match_id,
  pr.user_id,
  pr.home_score,
  pr.away_score,
  pr.points,
  pr.created_at,
  pr.updated_at,
  p.name AS user_name,
  p.avatar_url AS user_avatar_url
FROM predictions pr
JOIN profiles p ON p.id = pr.user_id;
```

## 7. App Shell Update

### 7.1 main.jsx

```jsx
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

### 7.2 App.jsx

```jsx
// Wrap authenticated routes with BottomNavigation
// Add pb-16 to page containers to account for fixed bottom nav

function App() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-16">
      <Routes>
        <Route path="/" element={...} />
        {/* Protected routes with BottomNavigation */}
        <Route path="/matches" element={<ProtectedRoute><Matches /><BottomNavigation /></ProtectedRoute>} />
        <Route path="/match/:matchId" element={<ProtectedRoute><MatchDetails /><BottomNavigation /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /><BottomNavigation /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute><Rules /><BottomNavigation /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
```

## 8. Environment Variables

No new environment variables required. Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` remain the same.

## 9. Development Sequencing

1. Install Tailwind CSS and configure (tailwind.config.js, index.css, postcss.config.js)
2. Create ThemeContext and ThemeProvider
3. Create migration 0003_social_rls.sql and apply
4. Create useMatchPredictions hook
5. Update useMatches hook with prediction counts
6. Create BottomNavigation component
7. Create ThemeToggle component
8. Update App shell (ThemeProvider, BottomNavigation, routing)
9. Create MatchDetails page (replaces Predict page)
10. Create PredictionRow component
11. Migrate MatchCard to Tailwind + prediction count
12. Migrate Matches page to Tailwind
13. Migrate Leaderboard page to Tailwind
14. Migrate Rules page to Tailwind
15. Migrate Login page to Tailwind
16. Migrate ScorePicker, LeaderboardRow, Podium to Tailwind
17. Build verification + visual QA in both themes
