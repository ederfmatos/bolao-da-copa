---
status: completed
title: Migrate Matches page to Tailwind
type: frontend
complexity: medium
dependencies: [task_07, task_10]
---

# Migrate Matches page to Tailwind

## Overview

Migrate the Matches page from inline styles to Tailwind CSS. Pass predictionCounts to MatchCard components.

<critical>
Remove all inline styles and replace with Tailwind classes.
- Use predictionCounts from useMatches hook.
- Maintain existing grouping logic (open, closed, finished).
- Tests are required.
</critical>

<requirements>
1. MUST remove all inline styles from Matches.jsx.
2. MUST replace with Tailwind CSS classes.
3. MUST use predictionCounts from useMatches hook.
4. MUST pass predictionCount to each MatchCard.
5. MUST support dark mode via Tailwind dark: classes.
6. MUST maintain existing grouping and filtering logic.
7. SHOULD improve visual hierarchy with Tailwind typography.
</requirements>

## Subtasks

- [ ] Remove inline styles from Matches.jsx.
- [ ] Add Tailwind classes for layout and styling.
- [ ] Pass predictionCount to MatchCard.
- [ ] Add dark mode support.
- [ ] Verify grouping logic still works.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/hooks/useMatches.js` — provides predictionCounts.
- `src/components/MatchCard.jsx` — receives predictionCount.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- Matches page migrated to Tailwind.
- predictionCounts passed to MatchCard.
- Dark mode supported.
- Existing functionality preserved.

## Tests

### Unit Tests
- [ ] Page renders without inline styles.
- [ ] Tailwind classes applied correctly.
- [ ] MatchCard receives predictionCount prop.
- [ ] Grouping logic (open, closed, finished) works.
- [ ] Empty state renders when no matches.

### Integration Tests
- [ ] Matches page loads and displays matches.
- [ ] Prediction counts display on cards.

## Success Criteria

- Matches page uses Tailwind only.
- Prediction counts visible on cards.
- Dark mode works.
- All existing features work.
