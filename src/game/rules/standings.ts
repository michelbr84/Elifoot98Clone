import { PrismaClient, Standing } from '@prisma/client'

interface StandingUpdate {
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

export class StandingsManager {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Update standings after a match is played
   */
  async updateAfterMatch(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<void> {
    // Get match details
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        fixture: {
          include: {
            homeClub: true,
            awayClub: true,
            division: true
          }
        }
      }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    const { fixture } = match
    const seasonId = fixture.division.seasonId!

    // Calculate points and stats for each team
    const homeUpdate: StandingUpdate = {
      played: 1,
      won: homeScore > awayScore ? 1 : 0,
      drawn: homeScore === awayScore ? 1 : 0,
      lost: homeScore < awayScore ? 1 : 0,
      goalsFor: homeScore,
      goalsAgainst: awayScore,
      points: homeScore > awayScore ? 3 : (homeScore === awayScore ? 1 : 0)
    }

    const awayUpdate: StandingUpdate = {
      played: 1,
      won: awayScore > homeScore ? 1 : 0,
      drawn: awayScore === homeScore ? 1 : 0,
      lost: awayScore < homeScore ? 1 : 0,
      goalsFor: awayScore,
      goalsAgainst: homeScore,
      points: awayScore > homeScore ? 3 : (awayScore === homeScore ? 1 : 0)
    }

    // Update home team standing
    await this.updateTeamStanding(
      seasonId,
      fixture.homeClubId,
      homeUpdate
    )

    // Update away team standing
    await this.updateTeamStanding(
      seasonId,
      fixture.awayClubId,
      awayUpdate
    )

    // Recalculate positions for the division
    await this.recalculatePositions(seasonId, fixture.divisionId)
  }

  /**
   * Update a single team's standing
   */
  private async updateTeamStanding(
    seasonId: string,
    clubId: string,
    update: StandingUpdate
  ): Promise<void> {
    const standing = await this.prisma.standing.findUnique({
      where: {
        seasonId_clubId: {
          seasonId,
          clubId
        }
      }
    })

    if (!standing) {
      throw new Error('Standing not found')
    }

    await this.prisma.standing.update({
      where: { id: standing.id },
      data: {
        played: standing.played + update.played,
        won: standing.won + update.won,
        drawn: standing.drawn + update.drawn,
        lost: standing.lost + update.lost,
        goalsFor: standing.goalsFor + update.goalsFor,
        goalsAgainst: standing.goalsAgainst + update.goalsAgainst,
        points: standing.points + update.points
      }
    })
  }

  /**
   * Recalculate positions for all teams in a division
   */
  private async recalculatePositions(
    seasonId: string,
    divisionId: string
  ): Promise<void> {
    // Get all standings for the division
    const standings = await this.prisma.standing.findMany({
      where: {
        seasonId,
        club: {
          divisionId
        }
      },
      include: {
        club: true
      }
    })

    // Sort standings by points, goal difference, goals for
    standings.sort((a, b) => {
      // Points
      if (b.points !== a.points) {
        return b.points - a.points
      }

      // Goal difference
      const gdA = a.goalsFor - a.goalsAgainst
      const gdB = b.goalsFor - b.goalsAgainst
      if (gdB !== gdA) {
        return gdB - gdA
      }

      // Goals for
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor
      }

      // Alphabetical by club name (tiebreaker)
      return a.club.name.localeCompare(b.club.name)
    })

    // Update positions
    for (let i = 0; i < standings.length; i++) {
      await this.prisma.standing.update({
        where: { id: standings[i].id },
        data: { position: i + 1 }
      })
    }
  }

  /**
   * Get standings for a division
   */
  async getDivisionStandings(
    divisionId: string,
    seasonId: string
  ): Promise<Standing[]> {
    return this.prisma.standing.findMany({
      where: {
        seasonId,
        club: {
          divisionId
        }
      },
      include: {
        club: true
      },
      orderBy: {
        position: 'asc'
      }
    })
  }

  /**
   * Get promotion and relegation candidates
   */
  async getPromotionRelegation(
    divisionId: string,
    seasonId: string
  ): Promise<{
    promotion: Standing[]
    relegation: Standing[]
  }> {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId }
    })

    if (!division) {
      throw new Error('Division not found')
    }

    const standings = await this.getDivisionStandings(divisionId, seasonId)
    
    // Top 3 teams for promotion (except Serie A)
    const promotion = division.level > 1 ? standings.slice(0, 3) : []
    
    // Bottom 3 teams for relegation (except Serie D)
    const relegation = division.level < 4 ? standings.slice(-3) : []

    return { promotion, relegation }
  }

  /**
   * Reset standings for a new season
   */
  async resetSeasonStandings(seasonId: string): Promise<void> {
    await this.prisma.standing.updateMany({
      where: { seasonId },
      data: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }
    })
  }

  async initializeSeasonStandings(seasonId: string) {
    const divisions = await this.prisma.division.findMany({
      where: { seasonId },
      include: { clubs: true }
    })

    for (const division of divisions) {
      for (const club of division.clubs) {
        await this.prisma.standing.create({
          data: {
            seasonId,
            clubId: club.id,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
            position: 0
          }
        })
      }
    }

    // Update initial positions
    for (const division of divisions) {
      await this.updateDivisionPositions(seasonId, division.id)
    }
  }
}