'use server'

import { Player } from '@prisma/client'
import { MatchEngine } from '@/src/game/engine/match-engine'
import { StandingsManager } from '@/src/game/rules/standings'
import { SaveManager } from '@/src/game/save/save-manager'
import { NewsGenerator } from '@/src/game/news/news-generator'
import { LineupValidator } from '@/src/game/rules/lineup-validator'
import { SeasonManager } from '@/src/game/rules/season-manager'
import { prisma } from '@/src/lib/prisma'
import dayjs from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'

dayjs.extend(dayOfYear)

const saveManager = new SaveManager(prisma)

// Helper function to generate player names
function generatePlayerName(): string {
  const firstNames = ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Bruno', 'Felipe', 'Carlos', 'André', 'Marcelo']
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira', 'Alves', 'Pereira', 'Rodrigues']
  
  const first = firstNames[Math.floor(Math.random() * firstNames.length)]
  const last = lastNames[Math.floor(Math.random() * lastNames.length)]
  
  return `${first} ${last}`
}

export async function getManagerTactics(managerId: string) {
  const tactics = await prisma.tactic.findMany({
    where: { managerId },
    orderBy: { createdAt: 'desc' }
  })

  return tactics
}

// Helper function to get active tactic
export async function getActiveTactic(managerId: string) {
  const tactic = await prisma.tactic.findFirst({
    where: {
      managerId,
      isActive: true
    }
  })

  return tactic
}

// Helper function to get active lineup
export async function getActiveLineup(managerId: string) {
  const lineup = await prisma.lineup.findFirst({
    where: {
      managerId,
      isActive: true
    }
  })

  return lineup
}

export async function saveLineup(managerId: string, lineup: {
  formation: string
  playerIds: string[]
}) {
  // Validate that all players belong to the manager's club
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: { club: { include: { players: true } } }
  })

  if (!manager || !manager.club) {
    throw new Error('Manager or club not found')
  }

  const clubPlayerIds = manager.club.players.map(p => p.id)
  const validPlayerIds = lineup.playerIds.filter(id => clubPlayerIds.includes(id))

  if (validPlayerIds.length !== 11) {
    throw new Error('Invalid lineup: must have exactly 11 players from the club')
  }

  // Deactivate all current lineups
  await prisma.lineup.updateMany({
    where: { managerId },
    data: { isActive: false }
  })

  // Create new lineup
  const savedLineup = await prisma.lineup.create({
    data: {
      managerId,
      formation: lineup.formation,
      playerIds: JSON.stringify(validPlayerIds),
      isActive: true
    }
  })

  console.log(`Escalação salva para manager ${managerId}:`, {
    formation: lineup.formation,
    playerCount: validPlayerIds.length,
    players: validPlayerIds
  })

  return { success: true, lineup: savedLineup }
}

export async function getGameData(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: {
      club: {
        include: {
          division: true,
          players: true,
        }
      },
      tactics: {
        where: { isActive: true }
      },
      lineups: {
        where: { isActive: true }
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

async function simulateAITransfers() {
  // Get all AI-controlled clubs
  const aiClubs = await prisma.club.findMany({
    where: {
      OR: [
        { managedBy: { none: {} } }, // No manager
        { managedBy: { every: { isHuman: false } } } // AI manager
      ]
    },
    include: {
      players: true,
      division: true
    }
  })

  for (const club of aiClubs) {
    // Skip if club has no budget
    if (club.budget <= 0) continue

    // Analyze squad needs
    const playersByPosition = {
      GK: club.players.filter(p => p.position === 'GK'),
      DF: club.players.filter(p => p.position === 'DF'),
      MF: club.players.filter(p => p.position === 'MF'),
      FW: club.players.filter(p => p.position === 'FW')
    }

    // Determine positions that need reinforcement
    const needs = []
    if (playersByPosition.GK.length < 2) needs.push('GK')
    if (playersByPosition.DF.length < 4) needs.push('DF')
    if (playersByPosition.MF.length < 4) needs.push('MF')
    if (playersByPosition.FW.length < 2) needs.push('FW')

    if (needs.length === 0) continue

    // Find available players in the market
    const targetPosition = needs[Math.floor(Math.random() * needs.length)]
    const availablePlayers = await prisma.player.findMany({
      where: {
        position: targetPosition,
        club: {
          id: { not: club.id }
        }
      },
      orderBy: { overall: 'desc' },
      take: 10
    })

    if (availablePlayers.length === 0) continue

    // Try to buy a player within budget
    for (const player of availablePlayers) {
      const playerValue = calculatePlayerValue(player)
      const offerAmount = Math.round(playerValue * (0.8 + Math.random() * 0.4)) // 80-120% of value

      if (offerAmount <= club.budget * 0.5) { // Don't spend more than 50% of budget
        try {
          await makeTransferOffer(club.id, player.id, offerAmount)
          break // Only one transfer per cycle
        } catch (error) {
          // Continue to next player
        }
      }
    }
  }
}

export async function advanceDay(managerId: string, currentDate: Date) {
  const newDate = dayjs(currentDate).add(1, 'day').toDate()
  
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: { 
      club: {
        include: {
          players: true,
          division: true
        }
      }
    }
  })

  if (!manager || !manager.club) {
    throw new Error('Manager or club not found')
  }

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

  // Recover fitness based on player status
  const allPlayers = await prisma.player.findMany({
    where: {
      clubId: manager.clubId
    }
  })
  
  for (const player of allPlayers) {
    let fitnessRecovery = 0
    
    if (player.isInjured) {
      // Injured players don't recover fitness naturally
      continue
    }
    
    // Base recovery depends on age
    if (player.age < 25) {
      fitnessRecovery = 3 // Young players recover faster
    } else if (player.age < 30) {
      fitnessRecovery = 2 // Prime age players
    } else if (player.age < 35) {
      fitnessRecovery = 1 // Older players recover slower
    } else {
      fitnessRecovery = 1 // Very old players recover very slowly
    }
    
    // Don't exceed 100
    const newFitness = Math.min(100, player.fitness + fitnessRecovery)
    
    if (newFitness !== player.fitness) {
      await prisma.player.update({
        where: { id: player.id },
        data: { fitness: newFitness }
      })
    }
  }

  // Check if it's payday (every 7 days)
  const dayOfYear = dayjs(newDate).dayOfYear()
  if (dayOfYear && dayOfYear % 7 === 0) {
    // Calculate total wages
    const totalWages = manager.club.players.reduce((sum, player) => sum + player.wage, 0)
    
    // Deduct wages from budget
    await prisma.club.update({
      where: { id: manager.club.id },
      data: {
        budget: { decrement: totalWages }
      }
    })

    // Record financial transaction
    await prisma.finance.create({
      data: {
        clubId: manager.club.id,
        type: 'expense',
        category: 'salary',
        description: `Folha salarial semanal`,
        amount: totalWages,
        date: newDate
      }
    })

    // Check financial health
    const updatedClub = await prisma.club.findUnique({
      where: { id: manager.club.id }
    })

    if (updatedClub && updatedClub.budget < 0) {
      const newsGenerator = new NewsGenerator(prisma)
      await newsGenerator.createFinancialNews(manager.club.id, 'crisis')
    }
  }

  // Check if it's time for monthly sponsorship (every 30 days)
  if (dayOfYear && dayOfYear % 30 === 0) {
    const sponsorshipValue = (5 - manager.club.division.level) * 100000 / 12
    
    await prisma.club.update({
      where: { id: manager.club.id },
      data: {
        budget: { increment: sponsorshipValue }
      }
    })

    await prisma.finance.create({
      data: {
        clubId: manager.club.id,
        type: 'income',
        category: 'sponsor',
        description: `Patrocínio mensal`,
        amount: sponsorshipValue,
        date: newDate
      }
    })
  }

  // Check for player birthdays and contract expiries (once per year)
  const currentMonth = dayjs(newDate).month()
  const previousMonth = dayjs(currentDate).month()
  const currentDay = dayjs(newDate).date()
  
  // Transfer windows: January (month 0) and July (month 6)
  const isTransferWindow = currentMonth === 0 || currentMonth === 6
  
  // Simulate AI transfers on specific days during transfer window
  if (isTransferWindow && (currentDay === 5 || currentDay === 15 || currentDay === 25)) {
    await simulateAITransfers()
  }
  
  // New year - age players and check contracts
  if (currentMonth === 0 && previousMonth === 11) {
    // Age all players
    await prisma.player.updateMany({
      data: {
        age: { increment: 1 }
      }
    })

    // Decrease overall for players over 30
    const olderPlayers = await prisma.player.findMany({
      where: { age: { gt: 30 } }
    })

    for (const player of olderPlayers) {
      const decrease = player.age > 35 ? 3 : player.age > 32 ? 2 : 1
      await prisma.player.update({
        where: { id: player.id },
        data: {
          overall: Math.max(1, player.overall - decrease)
        }
      })
    }

    // Check for expiring contracts
    const expiringContracts = await prisma.player.findMany({
      where: {
        contractEndsAt: {
          lte: dayjs(newDate).add(6, 'months').toDate()
        }
      },
      include: { club: true }
    })

    for (const player of expiringContracts) {
      await prisma.news.create({
        data: {
          type: 'general',
          title: 'Contrato expirando',
          content: `${player.name} do ${player.club?.name} tem contrato expirando em breve.`,
          clubId: player.clubId,
          date: newDate
        }
      })
    }

    // Generate young players for each club (simple version)
    const allClubs = await prisma.club.findMany()
    
    for (const club of allClubs) {
      // Each club gets 1-2 youth players per year
      const numYouth = Math.floor(Math.random() * 2) + 1
      
      for (let i = 0; i < numYouth; i++) {
        const position = ['GK', 'DF', 'MF', 'FW'][Math.floor(Math.random() * 4)]
        const overall = Math.floor(Math.random() * 20) + 40 // 40-60 overall
        
        await prisma.player.create({
          data: {
            name: generatePlayerName(),
            age: 17 + Math.floor(Math.random() * 3), // 17-19 years
            nationality: 'Brasil',
            position,
            overall,
            fitness: 90 + Math.floor(Math.random() * 10),
            form: 50,
            morale: 70,
            value: overall * 5000,
            wage: overall * 100,
            contractEndsAt: dayjs(newDate).add(3, 'years').toDate(),
            clubId: club.id
          }
        })
      }
    }
  }

  // Check for season end
  const seasonManager = new SeasonManager(prisma)
  const seasonEnded = await seasonManager.checkAndProcessSeasonEnd(newDate)
  
  if (seasonEnded) {
    // Notify about new season
    await prisma.news.create({
      data: {
        type: 'general',
        title: 'Nova Temporada!',
        content: 'Uma nova temporada começou. Boa sorte!',
        clubId: manager.club.id,
        date: newDate
      }
    })
  }

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

  // Get next fixture for the player's club
  const playerFixture = await prisma.fixture.findFirst({
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
      },
      round: true
    }
  })

  if (!playerFixture) {
    throw new Error('No fixture to play')
  }

  // Get fixtures from the SAME ROUND as the player's fixture across ALL divisions
  const roundFixtures = await prisma.fixture.findMany({
    where: {
      roundId: playerFixture.roundId, // Only fixtures from the same round
      isPlayed: false
    },
    include: {
      homeClub: {
        include: { players: true, division: true }
      },
      awayClub: {
        include: { players: true, division: true }
      },
      round: true,
      division: true
    },
    orderBy: [
      { scheduledAt: 'asc' }
    ]
  })

  console.log(`Simulating Round ${playerFixture.round.number}: ${roundFixtures.length} fixtures across all divisions`)

  let playerMatchResult = null

  // Simulate all matches in the round
  for (const fixture of roundFixtures) {
    // Get tactics for both teams
    const homeTactic = await prisma.tactic.findFirst({
      where: {
        manager: {
          clubId: fixture.homeClubId
        },
        isActive: true
      }
    })
    
    const awayTactic = await prisma.tactic.findFirst({
      where: {
        manager: {
          clubId: fixture.awayClubId
        },
        isActive: true
      }
    })
    
    // Get lineups for both teams
    const homeLineup = await prisma.lineup.findFirst({
      where: {
        manager: {
          clubId: fixture.homeClubId
        },
        isActive: true
      }
    })
    
    const awayLineup = await prisma.lineup.findFirst({
      where: {
        manager: {
          clubId: fixture.awayClubId
        },
        isActive: true
      }
    })
    
    // Validate and build lineups
    const homeFormation = homeTactic?.formation || '4-4-2'
    const awayFormation = awayTactic?.formation || '4-4-2'
    
    let homePlayers: Player[]
    let awayPlayers: Player[]
    
    // Use saved lineup if available, otherwise auto-select
    if (homeLineup) {
      const playerIds = JSON.parse(homeLineup.playerIds) as string[]
      homePlayers = fixture.homeClub.players.filter(p => playerIds.includes(p.id))
      
      // If saved lineup is incomplete, fill with best available
      if (homePlayers.length < 11) {
        const homeLineupValidation = LineupValidator.validate(fixture.homeClub.players, homeFormation)
        homePlayers = homeLineupValidation.isValid 
          ? homeLineupValidation.players 
          : LineupValidator.getEmergencyLineup(fixture.homeClub.players)
      }
    } else {
      const homeLineupValidation = LineupValidator.validate(fixture.homeClub.players, homeFormation)
      homePlayers = homeLineupValidation.isValid 
        ? homeLineupValidation.players 
        : LineupValidator.getEmergencyLineup(fixture.homeClub.players)
    }
    
    if (awayLineup) {
      const playerIds = JSON.parse(awayLineup.playerIds) as string[]
      awayPlayers = fixture.awayClub.players.filter(p => playerIds.includes(p.id))
      
      // If saved lineup is incomplete, fill with best available
      if (awayPlayers.length < 11) {
        const awayLineupValidation = LineupValidator.validate(fixture.awayClub.players, awayFormation)
        awayPlayers = awayLineupValidation.isValid 
          ? awayLineupValidation.players 
          : LineupValidator.getEmergencyLineup(fixture.awayClub.players)
      }
    } else {
      const awayLineupValidation = LineupValidator.validate(fixture.awayClub.players, awayFormation)
      awayPlayers = awayLineupValidation.isValid 
        ? awayLineupValidation.players 
        : LineupValidator.getEmergencyLineup(fixture.awayClub.players)
    }
    
    if (homePlayers.length < 11 || awayPlayers.length < 11) {
      throw new Error(`Não foi possível formar escalações completas para ${fixture.homeClub.name} x ${fixture.awayClub.name}`)
    }
    
    const homeTeam = {
      name: fixture.homeClub.name,
      players: homePlayers,
      formation: homeFormation,
      aggression: homeTactic?.aggression || 50,
      pressure: homeTactic?.pressure || 50,
      isHome: true
    }

    const awayTeam = {
      name: fixture.awayClub.name,
      players: awayPlayers,
      formation: awayFormation,
      aggression: awayTactic?.aggression || 50,
      pressure: awayTactic?.pressure || 50,
      isHome: false
    }

    // Debug: Log applied tactics
    console.log(`[${fixture.division.name}] Match ${fixture.homeClub.name} vs ${fixture.awayClub.name}:`)
    console.log(`Home - Formation: ${homeFormation}, Aggression: ${homeTactic?.aggression || 50}, Pressure: ${homeTactic?.pressure || 50}`)
    console.log(`Away - Formation: ${awayFormation}, Aggression: ${awayTactic?.aggression || 50}, Pressure: ${awayTactic?.pressure || 50}`)
    console.log(`Home lineup: ${homeLineup ? 'SAVED' : 'AUTO'} (${homePlayers.length} players)`)
    console.log(`Away lineup: ${awayLineup ? 'SAVED' : 'AUTO'} (${awayPlayers.length} players)`)

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

    // Record financial transaction for match revenue (only for home team)
    await prisma.finance.create({
      data: {
        clubId: fixture.homeClubId,
        type: 'income',
        category: 'ticket',
        description: `Bilheteria vs ${fixture.awayClub.name}`,
        amount: match.revenue,
        date: new Date()
      }
    })

    // Update club budget for home team
    await prisma.club.update({
      where: { id: fixture.homeClubId },
      data: {
        budget: { increment: match.revenue }
      }
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
    // Only decrease fitness for players who actually played
    const homeTacticPressure = homeTactic?.pressure || 50
    const awayTacticPressure = awayTactic?.pressure || 50
    
    // Home team players
    for (const player of homePlayers) {
      const fatigueFactor = 10 + Math.floor((homeTacticPressure - 50) / 10) // Base 10, +1 per 10% pressure above 50
      await prisma.player.update({
        where: { id: player.id },
        data: {
          fitness: { 
            decrement: Math.min(fatigueFactor, player.fitness) // Don't go below 0
          }
        }
      })
    }
    
    // Away team players
    for (const player of awayPlayers) {
      const fatigueFactor = 12 + Math.floor((awayTacticPressure - 50) / 10) // Base 12 for away (travel), +1 per 10% pressure above 50
      await prisma.player.update({
        where: { id: player.id },
        data: {
          fitness: { 
            decrement: Math.min(fatigueFactor, player.fitness) // Don't go below 0
          }
        }
      })
    }

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

    // Store the result if this is the player's match
    if (fixture.id === playerFixture.id) {
      playerMatchResult = { 
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
  }

  if (!playerMatchResult) {
    throw new Error('Player match result not found')
  }

  return playerMatchResult
}

export async function startNewGame(managerName: string, clubId: string) {
  // Reset the entire game state for a fresh start
  await resetGameState()
  
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

async function resetGameState() {
  console.log('Resetting game state...')
  console.log('Starting deletion order: matchEvent → match → training → transfer → finance → news → lineup → tactic → saveSlot → manager')
  
  // Delete all game-related data in the correct order to avoid foreign key constraints
  await prisma.matchEvent.deleteMany()
  await prisma.match.deleteMany()
  await prisma.training.deleteMany()
  await prisma.transfer.deleteMany()
  await prisma.finance.deleteMany()
  await prisma.news.deleteMany()

  // Delete tables that reference Manager (must be done before deleting managers)
  console.log('Deleting lineups...')
  await prisma.lineup.deleteMany()
  console.log('Deleting tactics...')
  await prisma.tactic.deleteMany()
  console.log('Deleting save slots...')
  await prisma.saveSlot.deleteMany()

  // Now safe to delete managers
  console.log('Deleting managers...')
  await prisma.manager.deleteMany()
  console.log('Game state reset completed successfully!')
  
  // Reset fixtures to unplayed state
  await prisma.fixture.updateMany({
    data: { isPlayed: false }
  })
  
  // Reset player stats to initial state
  await prisma.player.updateMany({
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
  
  // Reset standings to initial positions (by creation order)
  const season = await prisma.season.findFirst({
    where: { isActive: true }
  })
  
  if (season) {
    // Delete existing standings
    await prisma.standing.deleteMany({
      where: { seasonId: season.id }
    })
    
    // Recreate initial standings
    const clubs = await prisma.club.findMany({
      orderBy: [
        { divisionId: 'asc' },
        { createdAt: 'asc' }
      ]
    })
    
    let positionCounter = 1
    let currentDivisionId = ''
    
    for (const club of clubs) {
      // Reset position counter for each division
      if (club.divisionId !== currentDivisionId) {
        positionCounter = 1
        currentDivisionId = club.divisionId
      }
      
      await prisma.standing.create({
        data: {
          seasonId: season.id,
          clubId: club.id,
          position: positionCounter,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        }
      })
      
      positionCounter++
    }
  }
  
  // Reset club budgets to initial values based on division
  const divisions = await prisma.division.findMany()
  
  for (const division of divisions) {
    const budgetRange = {
      1: { min: 5000000, max: 20000000 }, // Serie A
      2: { min: 2000000, max: 8000000 },  // Serie B
      3: { min: 500000, max: 3000000 },   // Serie C
      4: { min: 100000, max: 1000000 }    // Serie D
    }
    
    const range = budgetRange[division.level as keyof typeof budgetRange] || budgetRange[4]
    
    await prisma.club.updateMany({
      where: { divisionId: division.id },
      data: {
        budget: Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      }
    })
  }
  
  console.log('Game state reset completed!')
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

export async function getTransferData(managerId: string) {
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

  const otherClubs = await prisma.club.findMany({
    where: {
      id: { not: manager.club.id }
    },
    include: {
      players: true
    }
  })

  // Get recent transfers (last 30 days)
  const recentTransfers = await prisma.transfer.findMany({
    where: {
      transferDate: {
        gte: dayjs().subtract(30, 'days').toDate()
      },
      status: 'accepted'
    },
    include: {
      player: true,
      fromClub: true,
      toClub: true
    },
    orderBy: {
      transferDate: 'desc'
    },
    take: 10
  })

  return {
    myClub: manager.club,
    otherClubs,
    budget: manager.club.budget,
    recentTransfers
  }
}

export async function makeTransferOffer(fromClubId: string, playerId: string, offerAmount: number) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { club: true }
  })

  if (!player || !player.clubId) {
    throw new Error('Player not found')
  }

  const fromClub = await prisma.club.findUnique({
    where: { id: fromClubId }
  })

  if (!fromClub) {
    throw new Error('Club not found')
  }

  if (fromClub.budget < offerAmount) {
    throw new Error('Insufficient funds')
  }

  // Simple AI: accept if offer is >= player value
  const playerValue = calculatePlayerValue(player)
  const accepted = offerAmount >= playerValue * 0.9 // Accept if 90% or more of value

  if (accepted) {
    // Create transfer
    const transfer = await prisma.transfer.create({
      data: {
        playerId: playerId,
        fromClubId: player.clubId,
        toClubId: fromClubId,
        fee: offerAmount,
        wage: player.wage,
        contractYears: 3,
        status: 'accepted',
        transferDate: new Date()
      }
    })

    // Update player's club
    await prisma.player.update({
      where: { id: playerId },
      data: {
        clubId: fromClubId,
        contractEndsAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000) // 3 years
      }
    })

    // Update budgets
    await prisma.club.update({
      where: { id: fromClubId },
      data: { budget: { decrement: offerAmount } }
    })

    await prisma.club.update({
      where: { id: player.clubId },
      data: { budget: { increment: offerAmount } }
    })

    // Create news
    const newsGenerator = new NewsGenerator(prisma)
    await newsGenerator.createTransferNews(transfer.id)

    return { success: true, transfer }
  } else {
    // Reject offer
    await prisma.transfer.create({
      data: {
        playerId: playerId,
        fromClubId: player.clubId,
        toClubId: fromClubId,
        fee: offerAmount,
        wage: player.wage,
        contractYears: 3,
        status: 'rejected'
      }
    })

    return { success: false, message: 'Oferta recusada' }
  }
}

function calculatePlayerValue(player: Player): number {
  let value = player.overall * 10000
  
  if (player.age < 25) value *= 1.5
  else if (player.age > 30) value *= 0.8
  else if (player.age > 35) value *= 0.5
  
  if (player.position === 'FW') value *= 1.2
  else if (player.position === 'GK') value *= 0.9
  
  return Math.round(value)
}

export async function saveTactic(managerId: string, tactic: {
  formation: string
  aggression: number
  pressure: number
  passingStyle: string
}) {
  // Deactivate all current tactics
  await prisma.tactic.updateMany({
    where: { managerId },
    data: { isActive: false }
  })

  // Create or update the tactic
  const savedTactic = await prisma.tactic.create({
    data: {
      managerId,
      name: `Tática ${tactic.formation}`,
      formation: tactic.formation,
      aggression: tactic.aggression,
      pressure: tactic.pressure,
      passingStyle: tactic.passingStyle,
      isActive: true
    }
  })

  console.log(`Tática salva para manager ${managerId}:`, savedTactic)

  return { success: true, tactic: savedTactic }
}

export async function applyTraining(
  playerIds: string[], 
  trainingType: 'fitness' | 'form' | 'recovery' | 'intensive'
) {
  const updates: any = {}

  switch (trainingType) {
    case 'fitness':
      updates.fitness = { increment: 10 }
      updates.form = { increment: 5 }
      break
    case 'form':
      updates.form = { increment: 15 }
      updates.fitness = { increment: 5 }
      break
    case 'recovery':
      // Only for injured players
      updates.fitness = { increment: 20 }
      updates.injuryDays = { decrement: 2 }
      break
    case 'intensive':
      updates.form = { increment: 20 }
      updates.fitness = { decrement: 10 }
      break
  }

  // Apply training to selected players
  const updatePromises = playerIds.map(async (playerId) => {
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    })

    if (!player) return

    // For recovery training, only apply to injured players
    if (trainingType === 'recovery' && !player.isInjured) {
      return
    }

    // Calculate new values with caps
    const newFitness = Math.min(100, Math.max(0, 
      player.fitness + (updates.fitness?.increment || 0) - (updates.fitness?.decrement || 0)
    ))
    const newForm = Math.min(100, Math.max(0,
      player.form + (updates.form?.increment || 0) - (updates.form?.decrement || 0)
    ))

    await prisma.player.update({
      where: { id: playerId },
      data: {
        fitness: newFitness,
        form: newForm,
        injuryDays: player.isInjured && trainingType === 'recovery' 
          ? Math.max(0, player.injuryDays - 2)
          : player.injuryDays
      }
    })

    // Clear injury if fully recovered
    if (player.isInjured && player.injuryDays <= 2 && trainingType === 'recovery') {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          isInjured: false,
          injuryDays: 0
        }
      })
    }

    // Record training in database
    await prisma.training.create({
      data: {
        playerId,
        type: trainingType,
        date: new Date(),
        fitnessGain: newFitness - player.fitness,
        formGain: newForm - player.form
      }
    })
  })

  await Promise.all(updatePromises)

  return { success: true, playersTraiCount: playerIds.length }
}