import { FootballProvider, MatchResult, MatchStatus } from './types.ts'

interface ApiFootballMatch {
  fixture: {
    id: number
    date: string
    status: {
      short: string
      long: string
    }
  }
  league: {
    name: string
    round: string
  }
  teams: {
    home: {
      name: string
      logo: string
    }
    away: {
      name: string
      logo: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

interface ApiFootballResponse {
  response: ApiFootballMatch[]
}

function mapStatus(status: string): MatchStatus {
  const statusMap: Record<string, MatchStatus> = {
    NS: 'scheduled',
    TBD: 'scheduled',
    PST: 'scheduled',
    CANC: 'scheduled',
    SUSP: 'scheduled',
    INT: 'scheduled',
    FT: 'finished',
    AET: 'finished',
    PEN: 'finished',
    BT: 'finished',
    WO: 'finished',
    AU: 'finished',
    LIVE: 'live',
    '1H': 'live',
    HT: 'live',
    '2H': 'live',
    ET: 'live',
    P: 'live',
  }
  return statusMap[status] || 'scheduled'
}

export class ApiFootballProvider implements FootballProvider {
  name = 'API-Football'
  private apiKey: string
  private baseUrl = 'https://v3.football.api-sports.io'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('API_FOOTBALL_KEY') || ''
    if (!this.apiKey) {
      throw new Error('API_FOOTBALL_KEY environment variable is required')
    }
  }

  async fetchMatches(): Promise<MatchResult[]> {
    const url = `${this.baseUrl}/fixtures?league=1&season=2026`
    
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(
        `API-Football API error: ${response.status} ${response.statusText}`
      )
    }

    const data: ApiFootballResponse = await response.json()
    
    if (!data.response || data.response.length === 0) {
      return []
    }

    return data.response.map((match) => this.mapMatch(match))
  }

  private mapMatch(match: ApiFootballMatch): MatchResult {
    return {
      id: match.fixture.id.toString(),
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeFlag: undefined,
      awayFlag: undefined,
      groupName: match.league.round || 'Group Stage',
      kickoffAt: match.fixture.date,
      status: mapStatus(match.fixture.status.short),
      homeScore: match.goals.home,
      awayScore: match.goals.away,
    }
  }
}

export const apiFootballProvider = new ApiFootballProvider()
