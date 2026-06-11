---
status: completed
title: "NotificationToggle component + Profile integration"
type: frontend
complexity: low
dependencies:
  - task_06
---

# Task 08: NotificationToggle component + Profile integration

## Overview
Create a toggle component for the user profile page that allows users to enable or disable push notifications. The component provides a simple on/off switch with clear labeling. It integrates into the existing UserProfile page, following the project's component patterns.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create src/components/NotificationToggle.jsx following project component conventions
- MUST export default component
- MUST use useNotifications hook (task_06) to check subscription status
- MUST display toggle switch with "Notifications" label
- MUST show current subscription state (on/off)
- MUST call requestPermission when toggling on (if permission is 'default')
- MUST call unsubscribe when toggling off
- MUST show browser permission prompt if permission is 'default' and user tries to enable
- MUST show explanatory message if permission is 'denied' (cannot enable)
- MUST show loading state during toggle operation
- MUST show error state if operation fails
- MUST use Tailwind CSS exclusively (no inline styles)
- MUST support dark mode with appropriate classes
- MUST integrate into UserProfile page
</requirements>

## Subtasks
- [x] 8.1 Create NotificationToggle.jsx component file
- [x] 8.2 Implement toggle switch UI with label
- [x] 8.3 Implement toggle on handler (requestPermission + subscribe)
- [x] 8.4 Implement toggle off handler (unsubscribe)
- [x] 8.5 Add permission denied message handling
- [x] 8.6 Add loading state during toggle operation
- [x] 8.7 Add error state handling
- [x] 8.8 Style with Tailwind CSS and dark mode support
- [x] 8.9 Integrate component into UserProfile page
- [x] 8.10 Test rendering and interaction flows

## Implementation Details
Create a toggle component following the pattern from other form controls in the project. The component must use the `useNotifications` hook to check the current subscription status and manage the toggle state. When the user toggles on, if permission is 'default', it must request permission first, then subscribe. If permission is 'denied', it must show a message explaining that the user needs to enable notifications in browser settings. When the user toggles off, it must unsubscribe. Integrate the component into the UserProfile page so users can manage their notification preferences.

### Relevant Files
- `src/hooks/useNotifications.js` — Hook to use for subscription state (task_06)
- `src/pages/UserProfile.jsx` — Page to integrate the component
- `src/components/ScorePicker.jsx` — Reference for form control styling
- `src/components/UserStats.jsx` — Reference for profile page component structure

### Dependent Files
- `src/components/NotificationToggle.jsx` — File to be created
- `src/pages/UserProfile.jsx` — File to be modified

### Related ADRs
- None specific to this task

## Deliverables
- Component file `src/components/NotificationToggle.jsx` created
- Toggle switch UI implemented
- Toggle on/off handlers implemented
- Permission denied message handling
- Loading and error states
- Tailwind CSS styling with dark mode
- Integration into UserProfile page
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Component renders with toggle switch and label
  - [x] Toggle shows "on" state when subscribed
  - [x] Toggle shows "off" state when not subscribed
  - [x] Toggling on calls requestPermission
  - [x] Toggling on subscribes after permission granted
  - [x] Toggling off calls unsubscribe
  - [x] Permission denied message is shown when permission is 'denied'
  - [x] Loading state is shown during toggle operation
  - [x] Error state is shown if operation fails
  - [x] Component uses Tailwind classes (no inline styles)
  - [x] Dark mode classes are applied correctly
  - [x] Component is integrated into UserProfile page
- Integration tests:
  - [x] Full flow: toggle on → permission granted → subscribed → toggle shows "on"
  - [x] Full flow: toggle off → unsubscribed → toggle shows "off"
  - [x] Permission denied flow: toggle on → permission denied → message shown
  - [x] Component appears on UserProfile page
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Component follows project conventions
- Toggle state reflects subscription status
- User interactions work as expected
- Permission denied case is handled gracefully
- Styling matches project design system
