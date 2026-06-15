export function formatTimeRemaining(kickoffTime) {
  const now = new Date()
  const diffMs = kickoffTime.getTime() - now.getTime()
  if (diffMs <= 0) return null

  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes > 1 ? 's' : ''}`
  }
  if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`
  }
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`
}
