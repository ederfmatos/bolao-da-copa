export function calculatePoints(
  predicted: { home: number; away: number },
  actual: { home: number; away: number }
): number {
  if (predicted.home === actual.home && predicted.away === actual.away) {
    return 10
  }

  const predictedDiff = predicted.home - predicted.away
  const actualDiff = actual.home - actual.away
  const predictedWinner = Math.sign(predictedDiff)
  const actualWinner = Math.sign(actualDiff)

  if (predictedWinner !== 0 && predictedWinner === actualWinner && predictedDiff === actualDiff) {
    return 7
  }

  if (predictedWinner === actualWinner) {
    return 5
  }

  return 0
}
