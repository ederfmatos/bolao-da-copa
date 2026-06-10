---
status: pending
title: Migrate Leaderboard page to Tailwind
type: frontend
complexity: medium
dependencies: [task_07]
---

# Migrate Leaderboard page to Tailwind

## Overview

Migrate the Leaderboard page and its components (LeaderboardRow, Podium) from inline styles to Tailwind CSS.

<critical>
Remove all inline styles and replace with Tailwind classes.
- Maintain existing functionality (podium, current user highlight, real-time updates).
- Tests are required.
</critical>

<requirements>
1. MUST remove all inline styles from Leaderboard.jsx, LeaderboardRow.jsx, and Podium.jsx.
2. MUST replace with Tailwind CSS classes.
3. MUST support dark mode via Tailwind dark: classes.
4. MUST maintain existing functionality (podium, current user highlight).
5. SHOULD improve visual hierarchy with Tailwind typography.
</requirements>

## Subtasks

- [ ] Remove inline styles from Leaderboard.jsx.
- [ ] Remove inline styles from LeaderboardRow.jsx.
- [ ] Remove inline styles from Podium.jsx.
- [ ] Add Tailwind classes to all three files.
- [ ] Add dark mode support.
- [ ] Verify existing functionality.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/hooks/useLeaderboard.js` — unchanged.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- Leaderboard page and components migrated to Tailwind.
- Dark mode supported.
- Existing functionality preserved.

## Tests

### Unit Tests
- [ ] Pages render without inline styles.
- [ ] Tailwind classes applied correctly.
- [ ] Current user row is highlighted.
- [ ] Podium displays top 3.
- [ ] Empty state renders when no data.

### Integration Tests
- [ ] Leaderboard page loads and displays rankings.
- [ ] Real-time updates still work.

## Success Criteria

- Leaderboard uses Tailwind only.
- Dark mode works.
- All existing features work.
