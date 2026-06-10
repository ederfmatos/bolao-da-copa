# Task Memory: task_05.md

## Objective Snapshot

Create UserPredictionRow component that displays a single prediction row for user profile.

## Important Decisions

- Uses same points badge color pattern as PredictionRow (gte 10=green, gte 7=blue, gte 3=orange, else gray)
- Match time formatted with pt-BR locale
- Shows "Aguardando" for non-finished matches
- Uses match_status from view to determine if match is finished
- Score display uses &times; as separator (same as MatchCard)

## Learnings

- getByText('Brasil') fails when text is part of a node with emoji flags because React splits adjacent text nodes. Use container.textContent for text-with-emoji assertions.

## Files / Surfaces

- src/components/UserPredictionRow.jsx — created
- src/components/__tests__/UserPredictionRow.test.jsx — created

## Errors / Corrections

- Initial test had issues with text matching due to emoji/space splitting and duplicate score text nodes. Fixed by using container.textContent checks and function matchers.

## Ready for Next Run
