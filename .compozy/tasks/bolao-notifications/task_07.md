---
status: completed
title: "NotificationPrompt component + App.jsx integration"
type: frontend
complexity: low
dependencies:
  - task_06
---

# Task 07: NotificationPrompt component + App.jsx integration

## Overview
Create a banner component that prompts users to enable push notifications on their first visit after login. The component explains the value of notifications and provides a call-to-action button. It integrates into App.jsx to display after authentication, following the project's component patterns.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create src/components/NotificationPrompt.jsx following project component conventions
- MUST export default component
- MUST use useNotifications hook (task_06) to check permission and subscription status
- MUST display only when permission is 'default' (not yet asked) and user is authenticated
- MUST NOT display if permission is 'denied' or 'granted'
- MUST NOT display if already subscribed
- MUST show explanatory text about notification benefits
- MUST show "Enable notifications" CTA button
- MUST show dismiss/close button
- MUST call requestPermission on CTA click
- MUST show loading state during permission request
- MUST show success toast/message after enabling
- MUST use Tailwind CSS exclusively (no inline styles)
- MUST support dark mode with appropriate classes
- MUST integrate into App.jsx after authentication check
</requirements>

## Subtasks
- [x] 7.1 Create NotificationPrompt.jsx component file
- [x] 7.2 Implement conditional rendering based on permission and subscription state
- [x] 7.3 Add explanatory text about notification benefits
- [x] 7.4 Add CTA button with requestPermission handler
- [x] 7.5 Add dismiss button to hide prompt
- [x] 7.6 Add loading state during permission request
- [x] 7.7 Add success message after enabling
- [x] 7.8 Style with Tailwind CSS and dark mode support
- [x] 7.9 Integrate component into App.jsx
- [x] 7.10 Test rendering and interaction flows

## Implementation Details
Create a banner component following the pattern from other components like `MatchCard.jsx` or `LeaderboardRow.jsx`. The component must use the `useNotifications` hook to check the current permission state and subscription status. It should only render when the permission is 'default' (not yet asked) and the user is authenticated. The banner must explain the value of notifications (daily game summaries, result notifications, deadline reminders) and provide a clear CTA button. After the user enables notifications, show a success message or toast. Integrate the component into App.jsx so it appears after the user logs in.

### Relevant Files
- `src/hooks/useNotifications.js` — Hook to use for permission and subscription state (task_06)
- `src/App.jsx` — File to integrate the component
- `src/components/MatchCard.jsx` — Reference for component structure and Tailwind styling
- `src/components/BottomNavigation.jsx` — Reference for dark mode classes

### Dependent Files
- `src/components/NotificationPrompt.jsx` — File to be created
- `src/App.jsx` — File to be modified

### Related ADRs
- None specific to this task

## Deliverables
- Component file `src/components/NotificationPrompt.jsx` created
- Conditional rendering based on permission state
- Explanatory text and CTA button
- Dismiss functionality
- Loading and success states
- Tailwind CSS styling with dark mode
- Integration into App.jsx
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Component renders when permission is 'default'
  - [x] Component does not render when permission is 'denied'
  - [x] Component does not render when permission is 'granted'
  - [x] Component does not render when already subscribed
  - [x] Component does not render when user is not authenticated
  - [x] Explanatory text is displayed
  - [x] CTA button is displayed with correct text
  - [x] CTA button calls requestPermission on click
  - [x] Dismiss button hides the component
  - [x] Loading state is shown during permission request
  - [x] Success message is shown after enabling
  - [x] Component uses Tailwind classes (no inline styles)
  - [x] Dark mode classes are applied correctly
  - [x] Component is integrated into App.jsx
- Integration tests:
  - [x] Full flow: see prompt → click enable → permission granted → success message
  - [x] Dismiss flow: see prompt → click dismiss → prompt hidden
  - [x] Component appears after login
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Component follows project conventions
- Conditional rendering works correctly
- User interactions work as expected
- Styling matches project design system
