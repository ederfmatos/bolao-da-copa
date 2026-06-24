import { BracketSlot, SLOT_PHASE } from './bracketSlots'

export interface CalculateBracketPointsParams {
  slot: BracketSlot
  actualWinner: string
  actualOpponent: string
  userPredictedWinner: string
  userPredictedOpponent: string
}

export function calculateBracketPoints(params: CalculateBracketPointsParams): number {
  const { slot, actualWinner, actualOpponent, userPredictedWinner, userPredictedOpponent } = params
  const phase = SLOT_PHASE[slot]

  if (userPredictedWinner !== actualWinner) {
    return 0
  }

  const opponentCorrect = userPredictedOpponent === actualOpponent
  if (opponentCorrect) {
    return phase.fullPts
  }

  return phase.partialPts ?? phase.fullPts
}
