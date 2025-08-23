'use server'

import { PrismaClient } from '@prisma/client'
import { MatchEngine } from '@/src/game/engine/match-engine'
import { StandingsManager } from '@/src/game/rules/standings'
import { SaveManager } from '@/src/game/save/save-manager'
import { NewsGenerator } from '@/src/game/news/news-generator'
import { LineupValidator } from '@/src/game/rules/lineup-validator'
import dayjs from 'dayjs'

const prisma = new PrismaClient()
const saveManager = new SaveManager(prisma)

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

  // Get all fixtures for the division
  const fixtures = await prisma.fixture.findMany({
    where: {
      divisionId: manager.club.divisionId,
      round: {
        seasonId: season?.id
      }
    },
    include: {
      homeClub: true,
      awayClub: true,
      round: true,
      match: true
    },
    orderBy: [
      { round: { number: 'asc' } },
      { scheduledAt: 'asc' }
    ]
  })

  const currentRound = Math.max(
    1,
    fixtures.filter(f => f.isPlayed).length > 0
      ? Math.max(...fixtures.filter(f => f.isPlayed).map(f => f.round.number))
      : 1
  )

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
    division: manager.club.division,
    fixtures: fixtures.map(f => ({
      id: f.id,
      roundNumber: f.round.number,
      homeClub: f.homeClub,
      awayClub: f.awayClub,
      scheduledAt: f.scheduledAt.toISOString(),
      isPlayed: f.isPlayed,
      match: f.match
    })),
    currentRound
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
  
  // Validate and build lineups
  const homeFormation = '4-4-2' // TODO: Get from tactics
  const awayFormation = '4-4-2'
  
  const homeLineupValidation = LineupValidator.validate(fixture.homeClub.players, homeFormation)
  const awayLineupValidation = LineupValidator.validate(fixture.awayClub.players, awayFormation)
  
  // Use emergency lineup if validation fails
  const homePlayers = homeLineupValidation.isValid 
    ? homeLineupValidation.players 
    : LineupValidator.getEmergencyLineup(fixture.homeClub.players)
    
  const awayPlayers = awayLineupValidation.isValid 
    ? awayLineupValidation.players 
    : LineupValidator.getEmergencyLineup(fixture.awayClub.players)
  
  if (homePlayers.length < 11 || awayPlayers.length < 11) {
    throw new Error('Não foi possível formar escalações completas para a partida')
  }
  
  const homeTeam = {
    name: fixture.homeClub.name,
    players: homePlayers,
    formation: homeFormation,
    aggression: 50,
    pressure: 50,
    isHome: true
  }

  const awayTeam = {
    name: fixture.awayClub.name,
    players: awayPlayers,
    formation: awayFormation,
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

  // Record financial transaction for match revenue
  if (isHome) {
    await prisma.finance.create({
      data: {
        clubId: manager.clubId,
        type: 'income',
        category: 'ticket',
        description: `Bilheteria vs ${fixture.awayClub.name}`,
        amount: match.revenue
      }
    })

    // Update club budget
    await prisma.club.update({
      where: { id: manager.clubId },
      data: {
        budget: { increment: match.revenue }
      }
    })
  }

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

  // Apply injuries from match
  const newsGenerator = new NewsGenerator(prisma)
  const injuryEvents = result.events.filter(e => e.type === 'injury')
  for (const injury of injuryEvents) {
    if (injury.playerId) {
      await prisma.player.update({
        where: { id: injury.playerId },
        data: {
          isInjured: true,
          injuryDays: injury.detail?.days || 7
        }
      })
      await newsGenerator.createInjuryNews(injury.playerId, injury.detail?.days || 7)
    }
  }

  // Apply card suspensions
  const redCardEvents = result.events.filter(e => e.type === 'redCard')
  for (const redCard of redCardEvents) {
    if (redCard.playerId) {
      await prisma.player.update({
        where: { id: redCard.playerId },
        data: {
          redCards: { increment: 1 },
          banMatches: 1
        }
      })
      await newsGenerator.createSuspensionNews(redCard.playerId, 'red')
    }
  }

  // Check yellow card accumulation (5 yellows = 1 match ban)
  const yellowCardEvents = result.events.filter(e => e.type === 'yellowCard')
  for (const yellowCard of yellowCardEvents) {
    if (yellowCard.playerId) {
      const player = await prisma.player.update({
        where: { id: yellowCard.playerId },
        data: {
          yellowCards: { increment: 1 }
        }
      })
      
      if (player.yellowCards >= 5 && player.yellowCards % 5 === 0) {
        await prisma.player.update({
          where: { id: yellowCard.playerId },
          data: {
            banMatches: 1
          }
        })
        await newsGenerator.createSuspensionNews(yellowCard.playerId, 'yellow')
      }
    }
  }

  // Decrement suspensions for players who didn't play
  const allPlayerIds = [...fixture.homeClub.players, ...fixture.awayClub.players].map(p => p.id)
  const playingPlayerIds = result.events
    .filter(e => e.playerId)
    .map(e => e.playerId)
    .filter((id): id is string => id !== null)
  
  const benchPlayerIds = allPlayerIds.filter(id => !playingPlayerIds.includes(id))
  
  await prisma.player.updateMany({
    where: {
      id: { in: benchPlayerIds },
      banMatches: { gt: 0 }
    },
    data: {
      banMatches: { decrement: 1 }
    }
  })

  // Create match news
  await newsGenerator.createMatchNews(match.id)

  return { 
    match, 
    result: {
      homeClub: fixture.homeClub,
      awayClub: fixture.awayClub,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      events: result.events,
      commentary: result.commentary
    }, 
    fixture 
  }
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

export async function saveGame(
  managerId: string,
  saveName: string,
  gameDate: Date
) {
  try {
    const saveId = await saveManager.saveGame(managerId, saveName, gameDate)
    return { success: true, saveId }
  } catch (error) {
    console.error('Error saving game:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function loadGame(saveId: string) {
  try {
    const saveData = await saveManager.loadGame(saveId)
    return { success: true, saveData }
  } catch (error) {
    console.error('Error loading game:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function listSaves(managerId?: string) {
  try {
    const saves = await saveManager.listSaves(managerId)
    return { success: true, saves }
  } catch (error) {
    console.error('Error listing saves:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteSave(saveId: string) {
  try {
    await saveManager.deleteSave(saveId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting save:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getFinanceData(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: {
      club: {
        include: {
          players: true,
          finances: {
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      }
    }
  })

  if (!manager || !manager.club) {
    throw new Error('Manager or club not found')
  }

  // Calculate salary total
  const salaryTotal = manager.club.players.reduce((sum, player) => sum + player.wage, 0)

  // Get recent match revenues
  const recentMatches = await prisma.match.findMany({
    where: {
      fixture: {
        homeClubId: manager.clubId
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  const averageAttendance = recentMatches.length > 0
    ? Math.floor(recentMatches.reduce((sum, m) => sum + m.attendance, 0) / recentMatches.length)
    : manager.club.capacity * 0.7

  // Sponsorship value based on division
  const divisionLevel = await prisma.division.findUnique({
    where: { id: manager.club.divisionId },
    select: { level: true }
  })
  
  const sponsorshipValue = divisionLevel
    ? (5 - divisionLevel.level) * 100000 // Serie A: 400k, B: 300k, C: 200k, D: 100k
    : 100000

  // Calculate monthly income/expenses
  const monthlyIncome = (averageAttendance * 50 * 2) + (sponsorshipValue / 12) // 2 games per month avg
  const monthlyExpenses = (salaryTotal * 4) + 50000 // 4 weeks + maintenance

  // Format transactions
  const lastTransactions = manager.club.finances.map(f => ({
    id: f.id,
    date: f.createdAt,
    type: f.type as 'income' | 'expense',
    category: f.category,
    description: f.description,
    amount: f.amount
  }))

  return {
    balance: manager.club.budget,
    monthlyIncome,
    monthlyExpenses,
    lastTransactions,
    salaryTotal,
    averageAttendance,
    sponsorshipValue
  }
}

export async function getNews(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    select: { clubId: true }
  })

  if (!manager) {
    throw new Error('Manager not found')
  }

  const news = await prisma.news.findMany({
    orderBy: { date: 'desc' },
    take: 50,
    include: {
      club: {
        select: { name: true }
      }
    }
  })

  return news.map(n => ({
    id: n.id,
    date: n.date,
    type: n.type as any,
    title: n.title,
    content: n.content,
    clubId: n.clubId
  }))
}