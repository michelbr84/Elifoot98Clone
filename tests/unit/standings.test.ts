import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StandingsManager } from '@/src/game/rules/standings'
import { PrismaClient } from '@prisma/client'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    match: {
      findUnique: vi.fn(),
    },
    standing: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(mockPrismaClient)),
  }
  
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  }
})

describe('StandingsManager', () => {
  let standingsManager: StandingsManager
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    standingsManager = new StandingsManager(mockPrisma)
    vi.clearAllMocks()
  })

  describe('updateAfterMatch', () => {
    it('should update standings correctly for home win', async () => {
      const matchId = 'match1'
      const homeScore = 2
      const awayScore = 1
      
      // Mock match data
      mockPrisma.match.findUnique.mockResolvedValue({
        id: matchId,
        fixture: {
          homeClubId: 'club1',
          awayClubId: 'club2',
          division: {
            id: 'div1',
            seasonId: 'season1',
          },
          homeClub: { id: 'club1', name: 'Home FC' },
          awayClub: { id: 'club2', name: 'Away FC' },
        },
      })

      // Mock home team standing
      mockPrisma.standing.findUnique.mockResolvedValueOnce({
        id: 'standing1',
        clubId: 'club1',
        played: 5,
        won: 2,
        drawn: 1,
        lost: 2,
        goalsFor: 8,
        goalsAgainst: 7,
        points: 7,
      })

      // Mock away team standing
      mockPrisma.standing.findUnique.mockResolvedValueOnce({
        id: 'standing2',
        clubId: 'club2',
        played: 5,
        won: 3,
        drawn: 0,
        lost: 2,
        goalsFor: 10,
        goalsAgainst: 6,
        points: 9,
      })

      // Mock standings for recalculation
      mockPrisma.standing.findMany.mockResolvedValue([
        {
          id: 'standing1',
          clubId: 'club1',
          points: 10,
          goalsFor: 10,
          goalsAgainst: 8,
          club: { name: 'Home FC' },
        },
        {
          id: 'standing2',
          clubId: 'club2',
          points: 9,
          goalsFor: 11,
          goalsAgainst: 8,
          club: { name: 'Away FC' },
        },
      ])

      await standingsManager.updateAfterMatch(matchId, homeScore, awayScore)

      // Verify home team update (win)
      expect(mockPrisma.standing.update).toHaveBeenCalledWith({
        where: { id: 'standing1' },
        data: {
          played: 6,
          won: 3,
          drawn: 1,
          lost: 2,
          goalsFor: 10,
          goalsAgainst: 8,
          points: 10,
        },
      })

      // Verify away team update (loss)
      expect(mockPrisma.standing.update).toHaveBeenCalledWith({
        where: { id: 'standing2' },
        data: {
          played: 6,
          won: 3,
          drawn: 0,
          lost: 3,
          goalsFor: 11,
          goalsAgainst: 8,
          points: 9,
        },
      })
    })

    it('should update standings correctly for draw', async () => {
      const matchId = 'match2'
      const homeScore = 1
      const awayScore = 1
      
      mockPrisma.match.findUnique.mockResolvedValue({
        id: matchId,
        fixture: {
          homeClubId: 'club1',
          awayClubId: 'club2',
          division: {
            id: 'div1',
            seasonId: 'season1',
          },
          homeClub: { id: 'club1', name: 'Home FC' },
          awayClub: { id: 'club2', name: 'Away FC' },
        },
      })

      mockPrisma.standing.findUnique.mockResolvedValueOnce({
        id: 'standing1',
        clubId: 'club1',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      })

      mockPrisma.standing.findUnique.mockResolvedValueOnce({
        id: 'standing2',
        clubId: 'club2',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      })

      mockPrisma.standing.findMany.mockResolvedValue([])

      await standingsManager.updateAfterMatch(matchId, homeScore, awayScore)

      // Both teams should get 1 point for draw
      expect(mockPrisma.standing.update).toHaveBeenCalledWith({
        where: { id: 'standing1' },
        data: {
          played: 1,
          won: 0,
          drawn: 1,
          lost: 0,
          goalsFor: 1,
          goalsAgainst: 1,
          points: 1,
        },
      })

      expect(mockPrisma.standing.update).toHaveBeenCalledWith({
        where: { id: 'standing2' },
        data: {
          played: 1,
          won: 0,
          drawn: 1,
          lost: 0,
          goalsFor: 1,
          goalsAgainst: 1,
          points: 1,
        },
      })
    })
  })

  describe('getPromotionRelegation', () => {
    it('should identify promotion and relegation candidates', async () => {
      const divisionId = 'div2'
      const seasonId = 'season1'
      
      mockPrisma.division.findUnique.mockResolvedValue({
        id: divisionId,
        level: 2, // Serie B
      })

      const mockStandings = [
        { id: '1', position: 1, club: { name: 'Leader FC' } },
        { id: '2', position: 2, club: { name: 'Second FC' } },
        { id: '3', position: 3, club: { name: 'Third FC' } },
        { id: '4', position: 4, club: { name: 'Mid FC' } },
        { id: '5', position: 5, club: { name: 'Mid2 FC' } },
        { id: '6', position: 6, club: { name: 'Mid3 FC' } },
        { id: '7', position: 7, club: { name: 'Mid4 FC' } },
        { id: '8', position: 8, club: { name: 'Mid5 FC' } },
        { id: '9', position: 9, club: { name: 'Mid6 FC' } },
        { id: '10', position: 10, club: { name: 'Tenth FC' } },
        { id: '11', position: 11, club: { name: 'Eleventh FC' } },
        { id: '12', position: 12, club: { name: 'Bottom FC' } },
      ]

      standingsManager.getDivisionStandings = vi.fn().mockResolvedValue(mockStandings)

      const result = await standingsManager.getPromotionRelegation(divisionId, seasonId)

      // Top 3 for promotion
      expect(result.promotion).toHaveLength(3)
      expect(result.promotion[0].position).toBe(1)
      expect(result.promotion[1].position).toBe(2)
      expect(result.promotion[2].position).toBe(3)

      // Bottom 3 for relegation
      expect(result.relegation).toHaveLength(3)
      expect(result.relegation[0].position).toBe(10)
      expect(result.relegation[1].position).toBe(11)
      expect(result.relegation[2].position).toBe(12)
    })

    it('should not have promotion for Serie A', async () => {
      const divisionId = 'div1'
      const seasonId = 'season1'
      
      mockPrisma.division.findUnique.mockResolvedValue({
        id: divisionId,
        level: 1, // Serie A
      })

      standingsManager.getDivisionStandings = vi.fn().mockResolvedValue([])

      const result = await standingsManager.getPromotionRelegation(divisionId, seasonId)

      expect(result.promotion).toHaveLength(0)
    })

    it('should not have relegation for Serie D', async () => {
      const divisionId = 'div4'
      const seasonId = 'season1'
      
      mockPrisma.division.findUnique.mockResolvedValue({
        id: divisionId,
        level: 4, // Serie D
      })

      standingsManager.getDivisionStandings = vi.fn().mockResolvedValue([])

      const result = await standingsManager.getPromotionRelegation(divisionId, seasonId)

      expect(result.relegation).toHaveLength(0)
    })
  })
})