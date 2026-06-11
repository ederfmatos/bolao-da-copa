import { FootballProvider, MatchResult, MatchStatus } from './types.ts'

interface FootballDataOrgMatch {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  homeTeam: {
    name: string
    shortName?: string
    crest?: string
  }
  awayTeam: {
    name: string
    shortName?: string
    crest?: string
  }
  score: {
    fullTime: {
      home: number | null
      away: number | null
    }
  }
}

interface FootballDataOrgResponse {
  matches: FootballDataOrgMatch[]
}

function mapStatus(status: string): MatchStatus {
  const statusMap: Record<string, MatchStatus> = {
    SCHEDULED: 'scheduled',
    TIMED: 'scheduled',
    IN_PLAY: 'live',
    LIVE: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
    POSTPONED: 'scheduled',
    CANCELLED: 'scheduled',
  }
  return statusMap[status] || 'scheduled'
}

export class FootballDataOrgProvider implements FootballProvider {
  name = 'football-data.org'
  private apiKey: string
  private baseUrl = 'https://api.football-data.org/v4'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('FOOTBALL_DATA_API_KEY') || ''
  }

  async fetchMatches(): Promise<MatchResult[]> {
    if (!this.apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY environment variable is required')
    }

    const url = `${this.baseUrl}/competitions/WC/matches`
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(
        `football-data.org API error: ${response.status} ${response.statusText}`
      )
    }

    const data: FootballDataOrgResponse = await response.json()
    
    if (!data.matches) {
      return []
    }

    return data.matches.map((match) => this.mapMatch(match))
  }

  private mapMatch(match: FootballDataOrgMatch): MatchResult {
    return {
      id: match.id.toString(),
      homeTeam: match.homeTeam.shortName || match.homeTeam.name,
      awayTeam: match.awayTeam.shortName || match.awayTeam.name,
      homeFlag: undefined,
      awayFlag: undefined,
      groupName: match.group || match.stage || 'Group Stage',
      kickoffAt: match.utcDate,
      status: mapStatus(match.status),
      homeScore: match.score.fullTime.home,
      awayScore: match.score.fullTime.away,
    }
  }
}

export const footballDataOrgProvider = new FootballDataOrgProvider()
