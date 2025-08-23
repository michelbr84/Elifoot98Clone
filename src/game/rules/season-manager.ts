import { PrismaClient } from '@prisma/client'
import { StandingsManager } from './standings'
import { CalendarGenerator } from './calendar-generator'
import dayjs from 'dayjs'

export class SeasonManager {
  constructor(private prisma: PrismaClient) {}

  async checkAndProcessSeasonEnd(currentDate: Date): Promise<boolean> {
    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
      include: { 
        divisions: {
          include: {
            fixtures: {
              where: { isPlayed: false }
            }
          }
        }
      }
    })

    if (!activeSeason) return false

    // Check if all fixtures are played
    const hasUnplayedFixtures = activeSeason.divisions.some(
      division => division.fixtures.length > 0
    )

    if (hasUnplayedFixtures) return false

    // Season is complete!
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
    const promotions: Array<{ clubId: string, fromDivisionId: string, toDivisionId: string }> = []
    const relegations: Array<{ clubId: string, fromDivisionId: string, toDivisionId: string }> = []

    const sortedDivisions = season.divisions.sort((a, b) => a.level - b.level)

    for (let i = 0; i < sortedDivisions.length; i++) {
      const division = sortedDivisions[i]
      const standings = standingsByDivision.get(division.id) || []

      // Promotions (top 3 except for top division)
      if (i > 0 && standings.length >= 3) {
        const topThree = standings.slice(0, 3)
        const upperDivision = sortedDivisions[i - 1]
        
        for (const standing of topThree) {
          promotions.push({
            clubId: standing.clubId,
            fromDivisionId: division.id,
            toDivisionId: upperDivision.id
          })
        }
      }

      // Relegations (bottom 3 except for bottom division)
      if (i < sortedDivisions.length - 1 && standings.length >= 3) {
        const bottomThree = standings.slice(-3)
        const lowerDivision = sortedDivisions[i + 1]
        
        for (const standing of bottomThree) {
          relegations.push({
            clubId: standing.clubId,
            fromDivisionId: division.id,
            toDivisionId: lowerDivision.id
          })
        }
      }
    }

    // Apply promotions and relegations
    for (const promotion of promotions) {
      await this.prisma.club.update({
        where: { id: promotion.clubId },
        data: { divisionId: promotion.toDivisionId }
      })

      await this.prisma.news.create({
        data: {
          type: 'general',
          title: 'Promoção!',
          content: `${season.standings.find(s => s.clubId === promotion.clubId)?.club.name} foi promovido para a divisão superior!`,
          clubId: promotion.clubId,
          date: new Date()
        }
      })
    }

    for (const relegation of relegations) {
      await this.prisma.club.update({
        where: { id: relegation.clubId },
        data: { divisionId: relegation.toDivisionId }
      })

      await this.prisma.news.create({
        data: {
          type: 'general',
          title: 'Rebaixamento',
          content: `${season.standings.find(s => s.clubId === relegation.clubId)?.club.name} foi rebaixado para a divisão inferior.`,
          clubId: relegation.clubId,
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

    // Season summary news
    await this.prisma.news.create({
      data: {
        type: 'general',
        title: `Temporada ${season.year} Encerrada`,
        content: `A temporada ${season.year} chegou ao fim. ${promotions.length} clubes foram promovidos e ${relegations.length} foram rebaixados. A nova temporada ${nextYear} já começou!`,
        date: new Date()
      }
    })
  }
}