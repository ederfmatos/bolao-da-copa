---
status: completed
title: Update App shell with ThemeProvider and routing
type: frontend
complexity: medium
dependencies: [task_02, task_06]
---

# Update App shell with ThemeProvider and routing

## Overview

Update the App component to wrap everything in ThemeProvider, add BottomNavigation to authenticated routes, and update routing to use the new MatchDetails page path.

<critical>
Read TechSpec "App Shell Update" section before starting.
- Wrap App in ThemeProvider in main.jsx.
- Add BottomNavigation to all protected routes.
- Update route from /predict/:matchId to /match/:matchId.
- Tests are required.
</critical>

<requirements>
1. MUST wrap App in ThemeProvider in src/main.jsx.
2. MUST import src/index.css in main.jsx.
3. MUST add BottomNavigation to all protected routes in App.jsx.
4. MUST update route path from /predict/:matchId to /match/:matchId.
5. MUST add pb-16 to page containers for bottom nav spacing.
6. MUST maintain ProtectedRoute wrapping.
7. SHOULD keep Login route without BottomNavigation.
</requirements>

## Subtasks

- [x] Update main.jsx to import ThemeProvider and index.css.
- [x] Wrap App in ThemeProvider in main.jsx.
- [x] Update App.jsx to import BottomNavigation.
- [x] Add BottomNavigation to protected routes.
- [x] Update route path to /match/:matchId.
- [x] Add pb-16 class to page containers.
- [x] Verify routing works correctly.

## Implementation Details

Files to create:
- None.

### Relevant Files
- `src/context/ThemeContext.jsx` — ThemeProvider.
- `src/components/BottomNavigation.jsx` — navigation component.

### Dependent Files
- All pages will be rendered within the new shell.

### Related ADRs
- ADR-005: Redesign completo em uma fase com Tailwind CSS.

## Deliverables

- App wrapped in ThemeProvider.
- BottomNavigation visible on authenticated pages.
- Routing updated to /match/:matchId.
- Page content has proper spacing for bottom nav.

## Tests

### Unit Tests
- [x] main.jsx imports ThemeProvider and index.css.
- [x] App is wrapped in ThemeProvider.
- [x] BottomNavigation is rendered on protected routes.
- [x] Login route does not have BottomNavigation.
- [x] Route /match/:matchId exists.

### Integration Tests
- [x] Navigating to /matches shows BottomNavigation.
- [x] Navigating to / shows Login without BottomNavigation.
- [x] Page content does not overlap with BottomNavigation.

## Success Criteria

- ThemeProvider wraps the app.
- BottomNavigation appears on authenticated pages.
- Routing works correctly.
- No visual overlap with bottom nav.
