import { PrismaClient } from '@prisma/client'
import { StandingsManager } from './standings'
import { CalendarGenerator } from './calendar-generator'
import dayjs from 'dayjs'

export class SeasonManager {
  constructor(private prisma: PrismaClient) {}

  async getSeasonStatus() {
    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
      include: { 
        divisions: {
          include: {
            fixtures: true,
            clubs: true
          }
        }
      }
    })

    if (!activeSeason) return null

    const status = {
      seasonYear: activeSeason.year,
      divisions: [] as any[]
    }

    for (const division of activeSeason.divisions) {
      const totalFixtures = division.fixtures.length
      const playedFixtures = division.fixtures.filter(f => f.isPlayed).length
      const unplayedFixtures = totalFixtures - playedFixtures
      
      status.divisions.push({
        name: division.name,
        totalFixtures,
        playedFixtures,
        unplayedFixtures,
        totalClubs: division.clubs.length,
        expectedFixtures: (division.clubs.length - 1) * 2 * (division.clubs.length / 2) // Round robin formula
      })
    }

    return status
  }

  async checkAndProcessSeasonEnd(currentDate: Date): Promise<boolean> {
    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
      include: { 
        divisions: {
          include: {
            fixtures: true,
            clubs: true
          }
        }
      }
    })

    if (!activeSeason) return false

    // Debug logging
    console.log('=== SEASON END CHECK ===')
    console.log('Active Season:', activeSeason.year)
    console.log('Current Date:', currentDate)
    
    let allFixturesPlayed = true
    
    // Check each division
    for (const division of activeSeason.divisions) {
      const totalFixtures = division.fixtures.length
      const playedFixtures = division.fixtures.filter(f => f.isPlayed).length
      const unplayedFixtures = totalFixtures - playedFixtures
      
      console.log(`Division: ${division.name}`)
      console.log(`  Total fixtures: ${totalFixtures}`)
      console.log(`  Played fixtures: ${playedFixtures}`)
      console.log(`  Unplayed fixtures: ${unplayedFixtures}`)
      console.log(`  Total clubs: ${division.clubs.length}`)
      
      // With 12 clubs, each club plays 22 matches (11 home, 11 away)
      // Total fixtures = 12 * 11 = 132
      const expectedFixtures = division.clubs.length * (division.clubs.length - 1)
      console.log(`  Expected fixtures: ${expectedFixtures}`)
      
      if (unplayedFixtures > 0) {
        allFixturesPlayed = false
      }
    }

    console.log('All fixtures played:', allFixturesPlayed)
    console.log('========================')

    if (!allFixturesPlayed) return false

    // Season is complete!
    console.log('🏆 SEASON COMPLETE! Processing season end...')
    await this.processSeasonEnd(activeSeason.id)
    return true
  }

  private async processSeasonEnd(seasonId: string) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        divisions: {
          include: {
            clubs: true
          }
        },
        standings: {
          include: {
            club: true
          }
        }
      }
    })

    if (!season) return

    // Get standings by division
    const standingsByDivision = new Map<string, typeof season.standings>()
    
    for (const division of season.divisions) {
      const divisionStandings = season.standings
        .filter(s => s.club.divisionId === division.id)
        .sort((a, b) => a.position - b.position)
      
      standingsByDivision.set(division.id, divisionStandings)
    }

    // Process promotions and relegations
    const promotions: Array<{ clubId: string, fromDivisionId: string, toDivisionId: string, clubName: string }> = []
    const relegations: Array<{ clubId: string, fromDivisionId: string, toDivisionId: string, clubName: string }> = []
    const eliminatedClubs: Array<{ clubId: string, clubName: string }> = []
    const firedManagers: Array<{ managerId: string, clubId: string, clubName: string }> = []

    const sortedDivisions = season.divisions.sort((a, b) => a.level - b.level)

    for (let i = 0; i < sortedDivisions.length; i++) {
      const division = sortedDivisions[i]
      const standings = standingsByDivision.get(division.id) || []

      // Promotions (top 3 except for Serie A)
      if (division.level > 1 && standings.length >= 3) {
        const topThree = standings.slice(0, 3)
        const upperDivision = sortedDivisions[i - 1]
        
        for (const standing of topThree) {
          promotions.push({
            clubId: standing.clubId,
            fromDivisionId: division.id,
            toDivisionId: upperDivision.id,
            clubName: standing.club.name
          })
        }
      }

      // Relegations (bottom 3 except for Serie D)
      if (division.level < 4 && standings.length >= 3) {
        const bottomThree = standings.slice(-3)
        const lowerDivision = sortedDivisions[i + 1]
        
        for (const standing of bottomThree) {
          relegations.push({
            clubId: standing.clubId,
            fromDivisionId: division.id,
            toDivisionId: lowerDivision.id,
            clubName: standing.club.name
          })
        }
      }

      // Serie D: Bottom 3 clubs are eliminated from the game
      if (division.level === 4 && standings.length >= 3) {
        const bottomThree = standings.slice(-3)
        
        for (const standing of bottomThree) {
          eliminatedClubs.push({
            clubId: standing.clubId,
            clubName: standing.club.name
          })

          // Check if there's a human manager for this club
          const manager = await this.prisma.manager.findFirst({
            where: { 
              clubId: standing.clubId,
              isHuman: true
            }
          })

          if (manager) {
            firedManagers.push({
              managerId: manager.id,
              clubId: standing.clubId,
              clubName: standing.club.name
            })
          }
        }
      }
    }

    // Apply promotions
    for (const promotion of promotions) {
      await this.prisma.club.update({
        where: { id: promotion.clubId },
        data: { divisionId: promotion.toDivisionId }
      })

      await this.prisma.news.create({
        data: {
          type: 'general',
          title: '🎉 Promoção!',
          content: `${promotion.clubName} foi promovido para a divisão superior!`,
          clubId: promotion.clubId,
          date: new Date()
        }
      })
    }

    // Apply relegations
    for (const relegation of relegations) {
      await this.prisma.club.update({
        where: { id: relegation.clubId },
        data: { divisionId: relegation.toDivisionId }
      })

      await this.prisma.news.create({
        data: {
          type: 'general',
          title: '📉 Rebaixamento',
          content: `${relegation.clubName} foi rebaixado para a divisão inferior.`,
          clubId: relegation.clubId,
          date: new Date()
        }
      })
    }

    // Handle eliminated clubs from Serie D
    for (const eliminated of eliminatedClubs) {
      await this.prisma.news.create({
        data: {
          type: 'general',
          title: '❌ Eliminado do Jogo',
          content: `${eliminated.clubName} foi eliminado do jogo após cair da Série D.`,
          clubId: eliminated.clubId,
          date: new Date()
        }
      })
    }

    // Handle fired managers
    for (const fired of firedManagers) {
      await this.prisma.news.create({
        data: {
          type: 'general',
          title: '💼 Manager Despedido',
          content: `O manager do ${fired.clubName} foi despedido após o clube ser eliminado da Série D.`,
          clubId: fired.clubId,
          date: new Date()
        }
      })
    }

    // Mark season as inactive
    await this.prisma.season.update({
      where: { id: seasonId },
      data: { isActive: false }
    })

    // Create new season
    const nextYear = season.year + 1
    const newSeason = await this.prisma.season.create({
      data: {
        year: nextYear,
        startDate: dayjs().month(1).date(1).toDate(), // February 1st
        endDate: dayjs().month(10).date(30).toDate(), // November 30th
        isActive: true
      }
    })

    // Create divisions for new season
    for (const division of sortedDivisions) {
      await this.prisma.division.create({
        data: {
          name: division.name,
          level: division.level,
          seasonId: newSeason.id
        }
      })
    }

    // Generate new calendar
    const calendarGenerator = new CalendarGenerator(this.prisma)
    await calendarGenerator.generateSeasonFixtures(newSeason.id)

    // Create initial standings for new season
    const standingsManager = new StandingsManager(this.prisma)
    await standingsManager.initializeSeasonStandings(newSeason.id)

    // Reset player stats for new season
    await this.prisma.player.updateMany({
      data: {
        fitness: 95,
        form: 50,
        morale: 50,
        isInjured: false,
        injuryDays: 0,
        banMatches: 0,
        yellowCards: 0,
        redCards: 0,
        goalsSeason: 0,
        assistsSeason: 0
      }
    })

    // Season summary news
    await this.prisma.news.create({
      data: {
        type: 'general',
        title: `🏆 Temporada ${season.year} Encerrada`,
        content: `A temporada ${season.year} chegou ao fim. ${promotions.length} clubes foram promovidos, ${relegations.length} foram rebaixados, e ${eliminatedClubs.length} foram eliminados da Série D. A nova temporada ${nextYear} já começou!`,
        date: new Date()
      }
    })

    // Return information about fired managers for UI handling
    return {
      firedManagers,
      eliminatedClubs,
      promotions,
      relegations
    }
  }

  // Method to get available Serie D clubs for fired managers
  async getAvailableSerieDClubs(): Promise<Array<{ id: string, name: string }>> {
    const serieDClubs = await this.prisma.club.findMany({
      where: {
        division: {
          level: 4,
          season: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    return serieDClubs
  }

  // Method to assign new club to fired manager
  async assignNewClubToManager(managerId: string, newClubId: string) {
    await this.prisma.manager.update({
      where: { id: managerId },
      data: { clubId: newClubId }
    })

    await this.prisma.news.create({
      data: {
        type: 'general',
        title: '🔄 Novo Clube',
        content: `Manager foi contratado por um novo clube da Série D.`,
        clubId: newClubId,
        date: new Date()
      }
    })
  }
}