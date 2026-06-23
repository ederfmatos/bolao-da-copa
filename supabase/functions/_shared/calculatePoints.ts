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

  if (predictedWinner !== actualWinner) {
    return 0
  }

  // Home team wins: winner off by ±1, loser exact
  if (
    actualWinner === 1 &&
    Math.abs(predicted.home - actual.home) === 1 &&
    predicted.away === actual.away
  ) {
    return 7
  }

  // Away team wins: winner off by ±1, loser exact
  if (
    actualWinner === -1 &&
    Math.abs(predicted.away - actual.away) === 1 &&
    predicted.home === actual.home
  ) {
    return 7
  }

  if (predictedWinner !== 0 && predictedDiff === actualDiff) {
    return 6
  }

  return 5
}
