import { describe, it, expect } from 'vitest'
import { MatchEngine, MatchTeam } from '@/src/game/engine/match-engine'
import { PlayerWithLineup } from '@/src/game/engine/ratings'

describe('MatchEngine', () => {
  // Helper to create a mock player
  const createPlayer = (
    id: string,
    name: string,
    position: string,
    overall: number
  ): PlayerWithLineup => ({
    id,
    name,
    age: 25,
    nationality: 'Brasil',
    position,
    overall,
    fitness: 100,
    form: 50,
    morale: 50,
    value: 100000,
    wage: 1000,
    contractEndsAt: new Date(),
    yellowCards: 0,
    redCards: 0,
    goalsSeason: 0,
    assistsSeason: 0,
    isInjured: false,
    injuryDays: 0,
    banMatches: 0,
    clubId: 'club1',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  // Helper to create a mock team
  const createTeam = (name: string, overallRating: number): MatchTeam => {
    const players: PlayerWithLineup[] = [
      createPlayer('gk1', 'Goleiro', 'GK', overallRating - 5),
      createPlayer('df1', 'Zagueiro 1', 'DF', overallRating),
      createPlayer('df2', 'Zagueiro 2', 'DF', overallRating),
      createPlayer('df3', 'Lateral E', 'DF', overallRating - 2),
      createPlayer('df4', 'Lateral D', 'DF', overallRating - 2),
      createPlayer('mf1', 'Volante', 'MF', overallRating),
      createPlayer('mf2', 'Meia 1', 'MF', overallRating + 2),
      createPlayer('mf3', 'Meia 2', 'MF', overallRating),
      createPlayer('mf4', 'Meia 3', 'MF', overallRating - 3),
      createPlayer('fw1', 'Atacante 1', 'FW', overallRating + 3),
      createPlayer('fw2', 'Atacante 2', 'FW', overallRating + 1),
    ]

    return {
      name,
      players,
      formation: '4-4-2',
      aggression: 50,
      pressure: 50,
      isHome: name === 'Time Casa'
    }
  }

  describe('simulateMatch', () => {
    it('should simulate a complete match', () => {
      const engine = new MatchEngine('test-seed')
      const homeTeam = createTeam('Time Casa', 70)
      const awayTeam = createTeam('Time Fora', 65)

      const result = engine.simulateMatch(homeTeam, awayTeam)

      expect(result).toBeDefined()
      expect(result.homeScore).toBeGreaterThanOrEqual(0)
      expect(result.awayScore).toBeGreaterThanOrEqual(0)
      expect(result.commentary.length).toBeGreaterThan(0)
      expect(result.statistics.homePossession + result.statistics.awayPossession).toBe(100)
    })

    it('should generate deterministic results with same seed', () => {
      const homeTeam = createTeam('Time Casa', 70)
      const awayTeam = createTeam('Time Fora', 65)

      const engine1 = new MatchEngine('same-seed')
      const result1 = engine1.simulateMatch(homeTeam, awayTeam)

      const engine2 = new MatchEngine('same-seed')
      const result2 = engine2.simulateMatch(homeTeam, awayTeam)

      expect(result1.homeScore).toBe(result2.homeScore)
      expect(result1.awayScore).toBe(result2.awayScore)
      expect(result1.events.length).toBe(result2.events.length)
    })

    it('should generate different results with different seeds', () => {
      const homeTeam = createTeam('Time Casa', 70)
      const awayTeam = createTeam('Time Fora', 65)

      const results = []
      for (let i = 0; i < 10; i++) {
        const engine = new MatchEngine(`seed-${i}`)
        const result = engine.simulateMatch(homeTeam, awayTeam)
        results.push(`${result.homeScore}-${result.awayScore}`)
      }

      // Should have at least some different results
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBeGreaterThan(1)
    })

    it('should favor stronger teams', () => {
      const strongTeam = createTeam('Time Forte', 85)
      const weakTeam = createTeam('Time Fraco', 55)

      let strongWins = 0
      let weakWins = 0
      let draws = 0

      // Simulate multiple matches
      for (let i = 0; i < 100; i++) {
        const engine = new MatchEngine(`test-${i}`)
        const result = engine.simulateMatch(strongTeam, weakTeam)

        if (result.homeScore > result.awayScore) {
          strongWins++
        } else if (result.awayScore > result.homeScore) {
          weakWins++
        } else {
          draws++
        }
      }

      // Strong team should win significantly more
      expect(strongWins).toBeGreaterThan(weakWins * 2)
    })

    it('should apply home advantage', () => {
      const team1 = createTeam('Time 1', 70)
      const team2 = createTeam('Time 2', 70)

      let homeWins = 0
      let awayWins = 0
      let draws = 0

      // Simulate multiple matches
      for (let i = 0; i < 100; i++) {
        const engine = new MatchEngine(`home-test-${i}`)
        team1.isHome = true
        team2.isHome = false
        const result = engine.simulateMatch(team1, team2)

        if (result.homeScore > result.awayScore) {
          homeWins++
        } else if (result.awayScore > result.homeScore) {
          awayWins++
        } else {
          draws++
        }
      }

      // Home team should have advantage
      expect(homeWins).toBeGreaterThan(awayWins)
    })

    it('should generate commentary in Portuguese', () => {
      const engine = new MatchEngine('commentary-test')
      const homeTeam = createTeam('Flamengo', 70)
      const awayTeam = createTeam('Vasco', 65)

      const result = engine.simulateMatch(homeTeam, awayTeam)

      // Check for Portuguese commentary
      expect(result.commentary[0]).toContain('Bem-vindos à partida')
      expect(result.commentary.some(c => c.includes('bola está rolando'))).toBe(true)
      expect(result.commentary[result.commentary.length - 1]).toContain('prazer acompanhar')
    })

    it('should update player statistics', () => {
      const engine = new MatchEngine('stats-test')
      const homeTeam = createTeam('Time Casa', 80)
      const awayTeam = createTeam('Time Fora', 60)

      const result = engine.simulateMatch(homeTeam, awayTeam)

      // Check if goals were recorded for players
      const totalGoals = result.homeScore + result.awayScore
      const scorers = result.events.filter(e => e.type === 'goal')
      expect(scorers.length).toBe(totalGoals)

      // Check fitness reduction
      for (const player of [...homeTeam.players, ...awayTeam.players]) {
        expect(player.fitness).toBeLessThan(100)
      }
    })
  })
})