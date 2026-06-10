---
status: pending
title: Migrate Login page to Tailwind
type: frontend
complexity: low
dependencies: [task_07]
---

# Migrate Login page to Tailwind

## Overview

Migrate the Login page from inline styles to Tailwind CSS.

<critical>
Remove all inline styles and replace with Tailwind classes.
- Maintain existing Google sign-in functionality.
- Tests are required.
</critical>

<requirements>
1. MUST remove all inline styles from Login.jsx.
2. MUST replace with Tailwind CSS classes.
3. MUST support dark mode via Tailwind dark: classes.
4. MUST maintain Google sign-in button functionality.
5. SHOULD improve visual design with Tailwind.
</requirements>

## Subtasks

- [ ] Remove inline styles from Login.jsx.
- [ ] Add Tailwind classes for layout and styling.
- [ ] Add dark mode support.
- [ ] Verify sign-in button works.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/hooks/useAuth.js` — unchanged.

### Dependent Files
- None.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- Login page migrated to Tailwind.
- Dark mode supported.
- Sign-in functionality preserved.

## Tests

### Unit Tests
- [ ] Page renders without inline styles.
- [ ] Tailwind classes applied correctly.
- [ ] Google sign-in button is present.
- [ ] Clicking button calls signInWithGoogle.

### Integration Tests
- [ ] Login page loads.
- [ ] Sign-in flow initiates.

## Success Criteria

- Login page uses Tailwind only.
- Dark mode works.
- Sign-in works.
