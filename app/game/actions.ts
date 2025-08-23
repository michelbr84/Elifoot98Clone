'use server'

import { PrismaClient } from '@prisma/client'
import { MatchEngine } from '@/src/game/engine/match-engine'
import { StandingsManager } from '@/src/game/rules/standings'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

export async function getGameData(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: {
      club: {
        include: {
          division: true,
          players: true,
        }
      }
    }
  })

  if (!manager || !manager.club) {
    throw new Error('Manager or club not found')
  }

  const season = await prisma.season.findFirst({
    where: { isActive: true }
  })

  const standing = await prisma.standing.findFirst({
    where: {
      clubId: manager.clubId!,
      seasonId: season?.id
    },
    include: {
      club: true
    }
  })

  const nextFixture = await prisma.fixture.findFirst({
    where: {
      OR: [
        { homeClubId: manager.clubId },
        { awayClubId: manager.clubId }
      ],
      isPlayed: false
    },
    orderBy: {
      scheduledAt: 'asc'
    },
    include: {
      homeClub: true,
      awayClub: true
    }
  })

  const standings = await prisma.standing.findMany({
    where: {
      seasonId: season?.id,
      club: {
        divisionId: manager.club.divisionId
      }
    },
    include: {
      club: true
    },
    orderBy: {
      position: 'asc'
    }
  })

  const injuredPlayers = manager.club.players.filter(p => p.isInjured)
  const suspendedPlayers = manager.club.players.filter(p => p.banMatches > 0)

  return {
    manager,
    club: manager.club,
    season,
    standing,
    nextFixture,
    standings,
    players: manager.club.players,
    injuredPlayers,
    suspendedPlayers,
    division: manager.club.division
  }
}

export async function advanceDay(managerId: string, currentDate: Date) {
  const newDate = dayjs(currentDate).add(1, 'day').toDate()
  
  // Update injured players
  await prisma.player.updateMany({
    where: {
      club: {
        managedBy: {
          some: { id: managerId }
        }
      },
      isInjured: true,
      injuryDays: { gt: 0 }
    },
    data: {
      injuryDays: { decrement: 1 }
    }
  })

  // Clear injuries for recovered players
  await prisma.player.updateMany({
    where: {
      injuryDays: { lte: 0 },
      isInjured: true
    },
    data: {
      isInjured: false,
      injuryDays: 0
    }
  })

  // Recover fitness slightly
  await prisma.player.updateMany({
    where: {
      club: {
        managedBy: {
          some: { id: managerId }
        }
      },
      fitness: { lt: 100 }
    },
    data: {
      fitness: { increment: 2 }
    }
  })

  return newDate
}

export async function playNextMatch(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: {
      club: {
        include: {
          players: true
        }
      }
    }
  })

  if (!manager || !manager.club) {
    throw new Error('Manager or club not found')
  }

  // Get next fixture
  const fixture = await prisma.fixture.findFirst({
    where: {
      OR: [
        { homeClubId: manager.clubId },
        { awayClubId: manager.clubId }
      ],
      isPlayed: false
    },
    orderBy: {
      scheduledAt: 'asc'
    },
    include: {
      homeClub: {
        include: { players: true }
      },
      awayClub: {
        include: { players: true }
      }
    }
  })

  if (!fixture) {
    throw new Error('No fixture to play')
  }

  // Prepare teams for match engine
  const isHome = fixture.homeClubId === manager.clubId
  const homeTeam = {
    name: fixture.homeClub.name,
    players: fixture.homeClub.players.slice(0, 11), // TODO: Use actual lineup
    formation: '4-4-2',
    aggression: 50,
    pressure: 50,
    isHome: true
  }

  const awayTeam = {
    name: fixture.awayClub.name,
    players: fixture.awayClub.players.slice(0, 11), // TODO: Use actual lineup
    formation: '4-4-2',
    aggression: 50,
    pressure: 50,
    isHome: false
  }

  // Simulate match
  const engine = new MatchEngine(`match-${fixture.id}`)
  const result = engine.simulateMatch(homeTeam, awayTeam)

  // Create match record
  const match = await prisma.match.create({
    data: {
      fixtureId: fixture.id,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      attendance: Math.floor(fixture.homeClub.capacity * 0.7),
      revenue: Math.floor(fixture.homeClub.capacity * 0.7 * 50), // §50 per ticket
      weather: 'sunny',
      referee: 'Árbitro Silva',
      seed: `match-${fixture.id}`
    }
  })

  // Update fixture
  await prisma.fixture.update({
    where: { id: fixture.id },
    data: { isPlayed: true }
  })

  // Update standings
  const standingsManager = new StandingsManager(prisma)
  await standingsManager.updateAfterMatch(match.id, result.homeScore, result.awayScore)

  // Save match events
  for (const event of result.events) {
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: event.minute,
        type: event.type,
        playerId: event.playerId,
        detail: JSON.stringify(event.detail || {})
      }
    })
  }

  // Update player stats from the match
  await prisma.player.updateMany({
    where: {
      OR: [
        { clubId: fixture.homeClubId },
        { clubId: fixture.awayClubId }
      ]
    },
    data: {
      fitness: { decrement: 10 }
    }
  })

  return { match, result, fixture }
}

export async function startNewGame(managerName: string, clubId: string) {
  // Create manager
  const manager = await prisma.manager.create({
    data: {
      name: managerName,
      isHuman: true,
      clubId
    }
  })

  // Create default tactic
  await prisma.tactic.create({
    data: {
      managerId: manager.id,
      name: 'Padrão',
      formation: '4-4-2',
      aggression: 50,
      pressure: 50,
      passingStyle: 'mixed',
      isActive: true
    }
  })

  return manager
}