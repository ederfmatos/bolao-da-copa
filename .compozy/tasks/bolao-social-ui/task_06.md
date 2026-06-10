---
status: pending
title: Create BottomNavigation component
type: frontend
complexity: low
dependencies: [task_02]
---

# Create BottomNavigation component

## Overview

Create a fixed bottom navigation bar with tabs for Matches, Leaderboard, and Rules. Include a theme toggle button. Use Tailwind CSS for styling with dark mode support.

<critical>
Read TechSpec "Component Specifications: BottomNavigation" before starting.
- Use react-router-dom NavLink for active state styling.
- Must be fixed to bottom of viewport.
- Tests are required.
</critical>

<requirements>
1. MUST create `src/components/BottomNavigation.jsx`.
2. MUST use fixed positioning at bottom of viewport.
3. MUST include 3 navigation tabs: Partidas, Classificação, Regras.
4. MUST use NavLink for active state highlighting.
5. MUST include theme toggle button.
6. MUST support dark mode via Tailwind dark: classes.
7. SHOULD use icons (emoji or SVG) for each tab.
8. SHOULD have z-index to stay above page content.
</requirements>

## Subtasks

- [ ] Create BottomNavigation.jsx with nav element.
- [ ] Add NavLink components for each tab.
- [ ] Style with Tailwind (fixed, bottom, bg, border).
- [ ] Add active state styling via NavLink className callback.
- [ ] Add theme toggle button using useTheme hook.
- [ ] Add dark mode support.

## Implementation Details

Files to create:
- `src/components/BottomNavigation.jsx` — full implementation.

### Relevant Files
- `src/context/ThemeContext.jsx` — for useTheme hook.

### Dependent Files
- `src/App.jsx` — will render BottomNavigation.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- BottomNavigation component created.
- Tabs navigate correctly.
- Active tab is visually highlighted.
- Theme toggle works.
- Dark mode supported.

## Tests

### Unit Tests
- [ ] Component renders without errors.
- [ ] Three navigation tabs are present.
- [ ] Theme toggle button is present.
- [ ] NavLink applies active class when route matches.
- [ ] Clicking theme toggle calls toggleTheme.

### Integration Tests
- [ ] Clicking a tab navigates to the correct route.
- [ ] Active tab styling changes based on current route.
- [ ] Theme toggle switches between light and dark mode.

## Success Criteria

- BottomNavigation renders correctly.
- Navigation works.
- Theme toggle functions.
- Dark mode styling applied.
