---
status: completed
title: Migrate Rules page to Tailwind
type: frontend
complexity: low
dependencies: [task_07]
---

# Migrate Rules page to Tailwind

## Overview

Migrate the Rules page from inline styles to Tailwind CSS.

<critical>
Remove all inline styles and replace with Tailwind classes.
- Maintain existing content and layout.
- Tests are required.
</critical>

<requirements>
1. MUST remove all inline styles from Rules.jsx.
2. MUST replace with Tailwind CSS classes.
3. MUST support dark mode via Tailwind dark: classes.
4. MUST maintain existing content (5 scoring scenarios, deadline notice).
5. SHOULD improve visual hierarchy with Tailwind typography.
</requirements>

## Subtasks

- [ ] Remove inline styles from Rules.jsx.
- [ ] Add Tailwind classes for layout and styling.
- [ ] Add dark mode support.
- [ ] Verify content is unchanged.

## Implementation Details

Files to create:
- None.

### Relevant Files
- None.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- Rules page migrated to Tailwind.
- Dark mode supported.
- Content unchanged.

## Tests

### Unit Tests
- [ ] Page renders without inline styles.
- [ ] Tailwind classes applied correctly.
- [ ] All 5 scoring scenarios display.
- [ ] Deadline notice is present.
- [ ] No Supabase calls made.

### Integration Tests
- [ ] Rules page loads and displays content.

## Success Criteria

- Rules page uses Tailwind only.
- Dark mode works.
- Content is correct.
