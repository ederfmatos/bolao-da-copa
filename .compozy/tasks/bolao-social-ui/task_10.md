---
status: pending
title: Migrate MatchCard to Tailwind + prediction count
type: frontend
complexity: medium
dependencies: [task_05, task_07]
---

# Migrate MatchCard to Tailwind + prediction count

## Overview

Migrate the MatchCard component from inline styles to Tailwind CSS. Add prediction count display showing how many participants have predicted.

<critical>
Read TechSpec "Component Specifications: MatchCard Updates" before starting.
- Remove all inline styles and replace with Tailwind classes.
- Add prediction count display.
- Maintain existing functionality (clickable for open matches, status badge, etc.).
- Tests are required.
</critical>

<requirements>
1. MUST remove all inline styles from MatchCard.jsx.
2. MUST replace with Tailwind CSS classes.
3. MUST add prediction count display (e.g., "8 palpites").
4. MUST accept predictionCount prop.
5. MUST maintain existing functionality (click handling, status badge, prediction indicator).
6. MUST support dark mode via Tailwind dark: classes.
7. SHOULD keep "Palpitado" badge for current user.
</requirements>

## Subtasks

- [ ] Remove inline styles from MatchCard.jsx.
- [ ] Add Tailwind classes for layout and styling.
- [ ] Add prediction count display.
- [ ] Add dark mode support.
- [ ] Verify click handling still works.
- [ ] Verify status badge styling.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/pages/Matches.jsx` — will pass predictionCount prop.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- MatchCard migrated to Tailwind.
- Prediction count displayed.
- Dark mode supported.
- Existing functionality preserved.

## Tests

### Unit Tests
- [ ] Component renders without inline styles.
- [ ] Tailwind classes applied correctly.
- [ ] Prediction count displays when > 0.
- [ ] "Palpitado" badge shows when hasPrediction is true.
- [ ] Status badge displays with correct color.
- [ ] Click handler fires for open matches.
- [ ] Click handler does not fire for closed/finished matches.

### Integration Tests
- [ ] MatchCard renders correctly in Matches page.

## Success Criteria

- MatchCard uses Tailwind only.
- Prediction count visible.
- Dark mode works.
- All existing features work.
