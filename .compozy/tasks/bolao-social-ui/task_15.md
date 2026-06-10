---
status: completed
title: Migrate remaining components to Tailwind
type: frontend
complexity: medium
dependencies: [task_07]
---

# Migrate remaining components to Tailwind

## Overview

Migrate the remaining components (ScorePicker, ProtectedRoute) from inline styles to Tailwind CSS.

<critical>
Remove all inline styles and replace with Tailwind classes.
- Maintain existing functionality.
- Tests are required.
</critical>

<requirements>
1. MUST remove all inline styles from ScorePicker.jsx.
2. MUST replace with Tailwind CSS classes.
3. MUST support dark mode via Tailwind dark: classes.
4. MUST maintain ScorePicker functionality (+/− buttons, min 0).
5. MUST verify ProtectedRoute has no inline styles (likely already clean).
</requirements>

## Subtasks

- [x] Remove inline styles from ScorePicker.jsx.
- [x] Add Tailwind classes to ScorePicker.
- [x] Add dark mode support to ScorePicker.
- [x] Verify ScorePicker functionality.
- [x] Check ProtectedRoute for inline styles.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/pages/MatchDetails.jsx` — uses ScorePicker.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- ScorePicker migrated to Tailwind.
- Dark mode supported.
- Functionality preserved.

## Tests

### Unit Tests
- [x] ScorePicker renders without inline styles.
- [x] Tailwind classes applied correctly.
- [x] +/− buttons work.
- [x] Score does not go below 0.
- [x] Disabled state works.

### Integration Tests
- [x] ScorePicker works in MatchDetails page.

## Success Criteria

- Components use Tailwind only.
- Dark mode works.
- All functionality works.
