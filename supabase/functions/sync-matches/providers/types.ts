export type MatchStatus = 'scheduled' | 'live' | 'finished'

export interface MatchResult {
  id: string
  homeTeam: string
  awayTeam: string
  homeFlag?: string
  awayFlag?: string
  groupName: string
  kickoffAt: string
  status: MatchStatus
  homeScore: number | null
  awayScore: number | null
}

export interface FootballProvider {
  name: string
  fetchMatches(): Promise<MatchResult[]>
}
