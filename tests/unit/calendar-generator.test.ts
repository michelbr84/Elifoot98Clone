import { describe, it, expect } from 'vitest'
import { CalendarGenerator } from '@/src/game/rules/calendar-generator'
import { PrismaClient } from '@prisma/client'

describe('CalendarGenerator', () => {
  const mockPrisma = {} as PrismaClient
  const generator = new CalendarGenerator(mockPrisma, 'test-seed')

  describe('generateRoundRobin', () => {
    it('should generate correct number of fixtures for even teams', () => {
      const clubIds = ['club1', 'club2', 'club3', 'club4']
      const fixtures = generator.generateRoundRobin(clubIds)
      
      // Each team plays every other team twice
      const expectedFixtures = clubIds.length * (clubIds.length - 1)
      expect(fixtures).toHaveLength(expectedFixtures)
    })

    it('should generate correct number of fixtures for odd teams', () => {
      const clubIds = ['club1', 'club2', 'club3', 'club4', 'club5']
      const fixtures = generator.generateRoundRobin(clubIds)
      
      // Each team plays every other team twice
      const expectedFixtures = clubIds.length * (clubIds.length - 1)
      expect(fixtures).toHaveLength(expectedFixtures)
    })

    it('should ensure each team plays home and away', () => {
      const clubIds = ['club1', 'club2', 'club3', 'club4']
      const fixtures = generator.generateRoundRobin(clubIds)
      
      // Count home and away games for each club
      const homeGames = new Map<string, number>()
      const awayGames = new Map<string, number>()
      
      for (const fixture of fixtures) {
        homeGames.set(fixture.homeClubId, (homeGames.get(fixture.homeClubId) || 0) + 1)
        awayGames.set(fixture.awayClubId, (awayGames.get(fixture.awayClubId) || 0) + 1)
      }
      
      // Each team should have equal home and away games
      for (const clubId of clubIds) {
        expect(homeGames.get(clubId)).toBe((clubIds.length - 1))
        expect(awayGames.get(clubId)).toBe((clubIds.length - 1))
      }
    })

    it('should not have a team playing itself', () => {
      const clubIds = ['club1', 'club2', 'club3', 'club4']
      const fixtures = generator.generateRoundRobin(clubIds)
      
      for (const fixture of fixtures) {
        expect(fixture.homeClubId).not.toBe(fixture.awayClubId)
      }
    })

    it('should generate deterministic fixtures with same seed', () => {
      const clubIds = ['club1', 'club2', 'club3', 'club4']
      
      const generator1 = new CalendarGenerator(mockPrisma, 'same-seed')
      const fixtures1 = generator1.generateRoundRobin(clubIds)
      
      const generator2 = new CalendarGenerator(mockPrisma, 'same-seed')
      const fixtures2 = generator2.generateRoundRobin(clubIds)
      
      expect(fixtures1).toEqual(fixtures2)
    })

    it('should generate different fixtures with different seeds', () => {
      const clubIds = ['club1', 'club2', 'club3', 'club4']
      
      const generator1 = new CalendarGenerator(mockPrisma, 'seed1')
      const fixtures1 = generator1.generateRoundRobin(clubIds)
      
      const generator2 = new CalendarGenerator(mockPrisma, 'seed2')
      const fixtures2 = generator2.generateRoundRobin(clubIds)
      
      // The fixtures should be different (at least some different ordering)
      const isDifferent = fixtures1.some((f1, i) => 
        f1.homeClubId !== fixtures2[i].homeClubId || 
        f1.awayClubId !== fixtures2[i].awayClubId
      )
      
      expect(isDifferent).toBe(true)
    })
  })
})