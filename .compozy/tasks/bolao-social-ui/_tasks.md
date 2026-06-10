# Bolão Social UI — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Install Tailwind CSS and configure | completed | low | — |
| 02 | Create ThemeContext and ThemeProvider | completed | low | task_01 |
| 03 | Create migration 0003_social_rls.sql | completed | medium | — |
| 04 | Create useMatchPredictions hook | completed | low | task_03 |
| 05 | Update useMatches hook with prediction counts | completed | low | task_03 |
| 06 | Create BottomNavigation component | completed | low | task_02 |
| 07 | Update App shell with ThemeProvider and routing | completed | medium | task_02, task_06 |
| 08 | Create MatchDetails page | completed | medium | task_04, task_05, task_07 |
| 09 | Create PredictionRow component | completed | low | task_08 |
| 10 | Migrate MatchCard to Tailwind + prediction count | completed | medium | task_05, task_07 |
| 11 | Migrate Matches page to Tailwind | completed | medium | task_07, task_10 |
| 12 | Migrate Leaderboard page to Tailwind | completed | medium | task_07 |
| 13 | Migrate Rules page to Tailwind | completed | low | task_07 |
| 14 | Migrate Login page to Tailwind | completed | low | task_07 |
| 15 | Migrate remaining components to Tailwind | completed | medium | task_07 |
| 16 | Build verification and visual QA | completed | low | task_08, task_09, task_10, task_11, task_12, task_13, task_14, task_15 |
