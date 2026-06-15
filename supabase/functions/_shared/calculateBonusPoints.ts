type Standings = {
  first?: string; second?: string; third?: string; fourth?: string
}
type BonusPrediction = {
  first_place: string; second_place: string
  third_place: string; fourth_place: string
}

export function calculateBonusPoints(
  prediction: BonusPrediction,
  standings: Standings
): number {
  const pairs: Array<[string, string | undefined]> = [
    [prediction.first_place,  standings.first],
    [prediction.second_place, standings.second],
    [prediction.third_place,  standings.third],
    [prediction.fourth_place, standings.fourth],
  ]
  const correct = pairs.filter(([p, a]) => a !== undefined && p === a).length
  if (correct === 0) return 0
  return correct * 50 + (correct === 4 ? 50 : 0)
}
