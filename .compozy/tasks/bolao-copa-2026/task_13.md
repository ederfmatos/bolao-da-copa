---
status: completed
title: Rules page
type: frontend
complexity: low
dependencies: [task_03, task_04]
---

## Overview

Implement the static Rules page that clearly explains the five scoring scenarios with descriptions and concrete examples. No data fetching required.

<critical>
- Read PRD before starting.
- Reference PRD "Core Features — Scoring Rules" for the five scenarios and point values.
- This is a static content page — no hooks, no Supabase queries.
- Focus on clarity and scannability of the content.
- Tests are required.
</critical>

<requirements>
1. MUST display all five scoring scenarios: exact score (10pts), correct winner + goal diff (7pts), correct draw (7pts), correct winner only (3pts), wrong result (0pts).
2. MUST include a concrete example for each scenario.
3. MUST include the 1-hour deadline rule prominently.
4. MUST be accessible from the bottom navigation at all times.
5. SHOULD use a card-based layout with the point value visually prominent per card.
</requirements>

## Subtasks

- [ ] Implement `Rules.jsx` with all five scoring cards and deadline notice.
- [ ] Verify all point values and examples match PRD exactly.

## Implementation Details

Files to modify:
- `src/pages/Rules.jsx` — full implementation (static content only).

### Relevant Files
- None — static page.

### Dependent Files
- None.

## Deliverables

- Rules page renders all five scenarios with correct point values and examples.
- Deadline notice visible.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] Rules page renders all five scoring scenario cards.
- [ ] Each card displays the correct point value (10, 7, 7, 3, 0).
- [ ] Deadline notice (1 hour) is present in the rendered output.
- [ ] No Supabase calls made on mount.

## Success Criteria

- All five scenarios rendered with correct values.
- Page accessible via bottom navigation.
- Test coverage >= 80%.
