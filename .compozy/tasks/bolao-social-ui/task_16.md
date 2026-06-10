---
status: completed
title: Build verification and visual QA
type: test
complexity: low
dependencies: [task_08, task_09, task_10, task_11, task_12, task_13, task_14, task_15]
---

# Build verification and visual QA

## Overview

Verify the build passes and perform visual QA across all pages in both light and dark modes. Ensure no inline styles remain and all features work correctly.

<critical>
Run `npm run build` and verify zero errors.
- Test all pages in both light and dark modes.
- Verify no inline styles remain in any component.
- Check mobile responsiveness.
- Tests are required.
</critical>

<requirements>
1. MUST run `npm run build` with zero errors.
2. MUST verify no inline styles remain in any component.
3. MUST test all pages in light mode.
4. MUST test all pages in dark mode.
5. MUST verify theme toggle works on all pages.
6. MUST verify MatchDetails shows social predictions.
7. MUST verify prediction counts display on MatchCard.
8. MUST verify BottomNavigation works on all authenticated pages.
9. SHOULD test on mobile viewport sizes.
10. SHOULD run Lighthouse audit for performance.
</requirements>

## Subtasks

- [ ] Run `npm run build` and verify success.
- [ ] Grep for inline styles (style={{) and verify none remain.
- [ ] Test Login page in light and dark modes.
- [ ] Test Matches page in light and dark modes.
- [ ] Test MatchDetails page in light and dark modes.
- [ ] Test Leaderboard page in light and dark modes.
- [ ] Test Rules page in light and dark modes.
- [ ] Verify theme toggle works on all pages.
- [ ] Verify social predictions display correctly.
- [ ] Verify prediction counts on MatchCard.
- [ ] Test on mobile viewport (375px width).
- [ ] Run Lighthouse audit.

## Implementation Details

Files to create:
- None.

### Relevant Files
- All src/ files.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- Build passes with zero errors.
- No inline styles remain.
- All pages work in both themes.
- All features functional.

## Tests

### Unit Tests
- [ ] `npm run build` succeeds.
- [ ] Build size < 500KB gzipped.

### Integration Tests
- [ ] No inline styles in any component.
- [ ] Light mode renders correctly on all pages.
- [ ] Dark mode renders correctly on all pages.
- [ ] Theme toggle works without page reload.
- [ ] Mobile layout (375px) is usable.

## Success Criteria

- Build passes.
- No inline styles.
- All pages work in both themes.
- All features functional.
- Performance score >= 90.
