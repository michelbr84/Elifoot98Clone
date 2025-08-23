import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

export interface SaveGameData {
  version: string
  createdAt: string
  gameDate: string
  seasonYear: number
  manager: {
    id: string
    name: string
    clubId: string
  }
  clubState: {
    budget: number
    divisionId: string
    position: number
  }
  players: Array<{
    id: string
    overall: number
    fitness: number
    form: number
    morale: number
    isInjured: boolean
    injuryDays: number
    banMatches: number
    goalsSeason: number
    assistsSeason: number
    yellowCards: number
    redCards: number
  }>
  standings: Array<{
    clubId: string
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
    position: number
  }>
  completedFixtures: string[] // fixture IDs
}

export class SaveGameSerializer {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Serialize current game state to JSON
   */
  async serialize(managerId: string, gameDate: Date): Promise<SaveGameData> {
    const manager = await this.prisma.manager.findUnique({
      where: { id: managerId },
      include: {
        club: {
          include: {
            players: true,
            standings: {
              where: {
                season: {
                  isActive: true
                }
              }
            }
          }
        }
      }
    })

    if (!manager || !manager.club) {
      throw new Error('Manager or club not found')
    }

    const season = await this.prisma.season.findFirst({
      where: { isActive: true }
    })

    if (!season) {
      throw new Error('No active season')
    }

    // Get all standings for the division
    const standings = await this.prisma.standing.findMany({
      where: {
        seasonId: season.id,
        club: {
          divisionId: manager.club.divisionId
        }
      }
    })

    // Get completed fixtures
    const completedFixtures = await this.prisma.fixture.findMany({
      where: {
        isPlayed: true,
        division: {
          seasonId: season.id
        }
      },
      select: {
        id: true
      }
    })

    const saveData: SaveGameData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      gameDate: gameDate.toISOString(),
      seasonYear: season.year,
      manager: {
        id: manager.id,
        name: manager.name,
        clubId: manager.clubId!
      },
      clubState: {
        budget: manager.club.budget,
        divisionId: manager.club.divisionId,
        position: manager.club.standings[0]?.position || 0
      },
      players: manager.club.players.map(p => ({
        id: p.id,
        overall: p.overall,
        fitness: p.fitness,
        form: p.form,
        morale: p.morale,
        isInjured: p.isInjured,
        injuryDays: p.injuryDays,
        banMatches: p.banMatches,
        goalsSeason: p.goalsSeason,
        assistsSeason: p.assistsSeason,
        yellowCards: p.yellowCards,
        redCards: p.redCards
      })),
      standings: standings.map(s => ({
        clubId: s.clubId,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        points: s.points,
        position: s.position
      })),
      completedFixtures: completedFixtures.map(f => f.id)
    }

    return saveData
  }

  /**
   * Restore game state from save data
   */
  async deserialize(saveData: SaveGameData): Promise<void> {
    // Validate save version
    if (saveData.version !== '1.0.0') {
      throw new Error('Incompatible save version')
    }

    // Start transaction
    await this.prisma.$transaction(async (tx) => {
      // Update club budget
      await tx.club.update({
        where: { id: saveData.manager.clubId },
        data: { budget: saveData.clubState.budget }
      })

      // Update player states
      for (const playerData of saveData.players) {
        await tx.player.update({
          where: { id: playerData.id },
          data: {
            overall: playerData.overall,
            fitness: playerData.fitness,
            form: playerData.form,
            morale: playerData.morale,
            isInjured: playerData.isInjured,
            injuryDays: playerData.injuryDays,
            banMatches: playerData.banMatches,
            goalsSeason: playerData.goalsSeason,
            assistsSeason: playerData.assistsSeason,
            yellowCards: playerData.yellowCards,
            redCards: playerData.redCards
          }
        })
      }

      // Update standings
      for (const standingData of saveData.standings) {
        const season = await tx.season.findFirst({
          where: { year: saveData.seasonYear }
        })

        if (season) {
          await tx.standing.update({
            where: {
              seasonId_clubId: {
                seasonId: season.id,
                clubId: standingData.clubId
              }
            },
            data: {
              played: standingData.played,
              won: standingData.won,
              drawn: standingData.drawn,
              lost: standingData.lost,
              goalsFor: standingData.goalsFor,
              goalsAgainst: standingData.goalsAgainst,
              points: standingData.points,
              position: standingData.position
            }
          })
        }
      }

      // Mark fixtures as played
      await tx.fixture.updateMany({
        where: {
          id: {
            in: saveData.completedFixtures
          }
        },
        data: {
          isPlayed: true
        }
      })
    })
  }
}