import { FootballProvider, MatchResult } from './types.ts'
import { footballDataOrgProvider } from './footballDataOrg.ts'
import { apiFootballProvider } from './apiFootball.ts'

export async function fetchWithFallback(
  providers: FootballProvider[]
): Promise<MatchResult[]> {
  for (const provider of providers) {
    try {
      console.log(`Attempting to fetch from ${provider.name}...`)
      const results = await provider.fetchMatches()
      
      if (results.length > 0) {
        console.log(`${provider.name} returned ${results.length} matches`)
        return results
      }
      
      console.warn(`${provider.name} returned empty results, trying next provider`)
    } catch (error) {
      console.warn(
        `${provider.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
  
  throw new Error('All football data providers failed')
}

export const defaultChain: FootballProvider[] = [
  footballDataOrgProvider,
  apiFootballProvider,
]

export { FootballProvider, MatchResult, MatchStatus } from './types.ts'
export { FootballDataOrgProvider } from './footballDataOrg.ts'
export { ApiFootballProvider } from './apiFootball.ts'
