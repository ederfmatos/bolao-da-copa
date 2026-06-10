---
status: completed
title: Create ThemeContext and ThemeProvider
type: frontend
complexity: low
dependencies: [task_01]
---

# Create ThemeContext and ThemeProvider

## Overview

Create a React context for managing dark/light theme state. The theme should persist across sessions via localStorage and respect system preference on first visit.

<critical>
- Read TechSpec "Theme Context" section before starting.
- Focus on context implementation only — no UI components in this task.
- Use 'class' strategy for dark mode (toggle 'dark' class on documentElement).
- Tests are required.
</critical>

<requirements>
1. MUST create `src/context/ThemeContext.jsx` with ThemeProvider and useTheme hook.
2. MUST initialize theme from localStorage, falling back to system preference.
3. MUST toggle 'dark' class on `document.documentElement` when theme changes.
4. MUST persist theme preference to localStorage on change.
5. MUST expose `{ theme, toggleTheme }` from useTheme hook.
6. SHOULD default to system preference (prefers-color-scheme) on first visit.
</requirements>

## Subtasks

- [x] Create src/context/ directory.
- [x] Create ThemeContext.jsx with ThemeProvider component.
- [x] Implement theme initialization (localStorage → system preference).
- [x] Implement useEffect to toggle 'dark' class on documentElement.
- [x] Implement toggleTheme function.
- [x] Export useTheme hook.

## Implementation Details

Files to create:
- `src/context/ThemeContext.jsx` — full implementation.

### Relevant Files
- `src/main.jsx` — will wrap App in ThemeProvider (task_07).

### Dependent Files
- All components will use useTheme for theme-aware styling.
- `src/components/ThemeToggle.jsx` — will consume useTheme.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- ThemeContext.jsx created with ThemeProvider and useTheme.
- Theme toggles correctly between light and dark.
- Theme persists across page reloads.

## Tests

### Unit Tests
- [x] ThemeProvider renders children without errors.
- [x] useTheme returns { theme, toggleTheme }.
- [x] Initial theme is read from localStorage if present.
- [x] Initial theme falls back to system preference if no localStorage.
- [x] toggleTheme switches between 'light' and 'dark'.
- [x] Theme change adds/removes 'dark' class on documentElement.
- [x] Theme change persists to localStorage.

### Integration Tests
- [x] Wrapping App in ThemeProvider allows useTheme in child components.
- [x] Theme persists after page reload.

## Success Criteria

- ThemeContext works correctly.
- Dark class is toggled on documentElement.
- Theme persists across sessions.
