import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import seedrandom from 'seedrandom'

interface FixtureData {
  homeClubId: string
  awayClubId: string
  roundNumber: number
}

export class CalendarGenerator {
  private prisma: PrismaClient
  private rng: seedrandom.PRNG

  constructor(prisma: PrismaClient, seed: string = 'calendar') {
    this.prisma = prisma
    this.rng = seedrandom(seed)
  }

  /**
   * Generate a round-robin tournament schedule
   * Each team plays every other team twice (home and away)
   */
  generateRoundRobin(clubIds: string[]): FixtureData[] {
    const fixtures: FixtureData[] = []
    const numTeams = clubIds.length
    const teams = [...clubIds]

    // If odd number of teams, add a "bye" placeholder
    if (numTeams % 2 !== 0) {
      teams.push('BYE')
    }

    const totalTeams = teams.length
    const roundsFirstHalf = totalTeams - 1

    // First half of season (each team plays once)
    for (let round = 0; round < roundsFirstHalf; round++) {
      const roundFixtures: FixtureData[] = []

      for (let i = 0; i < totalTeams / 2; i++) {
        const home = teams[i]
        const away = teams[totalTeams - 1 - i]

        if (home !== 'BYE' && away !== 'BYE') {
          // Alternate home/away based on round to balance the schedule
          if ((round + i) % 2 === 0) {
            roundFixtures.push({
              homeClubId: home,
              awayClubId: away,
              roundNumber: round + 1
            })
          } else {
            roundFixtures.push({
              homeClubId: away,
              awayClubId: home,
              roundNumber: round + 1
            })
          }
        }
      }

      fixtures.push(...roundFixtures)

      // Rotate teams (except first one)
      teams.splice(1, 0, teams.pop()!)
    }

    // Second half of season (return matches)
    const firstHalfFixtures = [...fixtures]
    for (const fixture of firstHalfFixtures) {
      fixtures.push({
        homeClubId: fixture.awayClubId,
        awayClubId: fixture.homeClubId,
        roundNumber: fixture.roundNumber + roundsFirstHalf
      })
    }

    // Shuffle fixtures within each round for variety
    const fixturesByRound = new Map<number, FixtureData[]>()
    for (const fixture of fixtures) {
      if (!fixturesByRound.has(fixture.roundNumber)) {
        fixturesByRound.set(fixture.roundNumber, [])
      }
      fixturesByRound.get(fixture.roundNumber)!.push(fixture)
    }

    // Shuffle each round
    const shuffledFixtures: FixtureData[] = []
    for (const [_, roundFixtures] of fixturesByRound) {
      this.shuffleArray(roundFixtures)
      shuffledFixtures.push(...roundFixtures)
    }

    return shuffledFixtures
  }

  /**
   * Generate fixtures for a division for the entire season
   */
  async generateDivisionFixtures(
    divisionId: string,
    seasonId: string,
    startDate: Date
  ): Promise<void> {
    // Get all clubs in the division
    const clubs = await this.prisma.club.findMany({
      where: { divisionId },
      select: { id: true }
    })

    const clubIds = clubs.map(c => c.id)
    const fixtures = this.generateRoundRobin(clubIds)

    // Group fixtures by round
    const roundsMap = new Map<number, FixtureData[]>()
    for (const fixture of fixtures) {
      if (!roundsMap.has(fixture.roundNumber)) {
        roundsMap.set(fixture.roundNumber, [])
      }
      roundsMap.get(fixture.roundNumber)!.push(fixture)
    }

    // Create rounds and fixtures in database
    for (const [roundNumber, roundFixtures] of roundsMap) {
      // Calculate date for this round (weekly matches)
      const roundDate = dayjs(startDate).add((roundNumber - 1) * 7, 'days')
      
      // Create round
      const round = await this.prisma.round.create({
        data: {
          number: roundNumber,
          seasonId
        }
      })

      // Create fixtures for this round
      for (const fixtureData of roundFixtures) {
        // Schedule matches on weekends (Saturday/Sunday)
        const isEvenMatch = roundFixtures.indexOf(fixtureData) % 2 === 0
        const matchDay = isEvenMatch ? 6 : 0 // Saturday or Sunday
        const matchDate = roundDate.day(matchDay).hour(16).minute(0).second(0)

        await this.prisma.fixture.create({
          data: {
            roundId: round.id,
            divisionId,
            homeClubId: fixtureData.homeClubId,
            awayClubId: fixtureData.awayClubId,
            scheduledAt: matchDate.toDate()
          }
        })
      }
    }
  }

  /**
   * Generate fixtures for all divisions in a season
   */
  async generateSeasonFixtures(seasonId: string): Promise<void> {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { divisions: true }
    })

    if (!season) {
      throw new Error('Season not found')
    }

    // Generate fixtures for each division
    for (const division of season.divisions) {
      console.log(`Generating fixtures for ${division.name}...`)
      
      // Stagger start dates by division level
      const divisionStartDate = dayjs(season.startDate)
        .add((division.level - 1) * 3, 'days')
        .toDate()

      await this.generateDivisionFixtures(
        division.id,
        seasonId,
        divisionStartDate
      )
    }
  }

  /**
   * Fisher-Yates shuffle using seeded random
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }
}