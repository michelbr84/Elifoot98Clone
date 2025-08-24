import { RNG } from './rng'
import { RatingsCalculator, TeamRatings, PlayerWithLineup } from './ratings'
import { CommentaryPtBR, CommentaryEvent } from '../commentary/ptBR'

export interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'injury' | 'substitution'
  playerId: string
  playerName: string
  team: 'home' | 'away'
  detail?: any
}

export interface MatchResult {
  homeScore: number
  awayScore: number
  events: MatchEvent[]
  commentary: string[]
  statistics: {
    homePossession: number
    awayPossession: number
    homeShots: number
    awayShots: number
    homeShotsOnTarget: number
    awayShotsOnTarget: number
    homeFouls: number
    awayFouls: number
    homeCorners: number
    awayCorners: number
    homeYellowCards: number
    awayYellowCards: number
    homeRedCards: number
    awayRedCards: number
  }
}

export interface MatchTeam {
  name: string
  players: PlayerWithLineup[]
  formation: string
  aggression: number
  pressure: number
  isHome: boolean
}

export class MatchEngine {
  private rng: RNG
  private ratingsCalculator: RatingsCalculator
  private commentary: CommentaryPtBR

  constructor(seed: string) {
    this.rng = new RNG(seed)
    this.ratingsCalculator = new RatingsCalculator()
    this.commentary = new CommentaryPtBR()
  }

  /**
   * Simulate a complete match
   */
  simulateMatch(homeTeam: MatchTeam, awayTeam: MatchTeam): MatchResult {
    // Initialize result
    const result: MatchResult = {
      homeScore: 0,
      awayScore: 0,
      events: [],
      commentary: [],
      statistics: {
        homePossession: 0,
        awayPossession: 0,
        homeShots: 0,
        awayShots: 0,
        homeShotsOnTarget: 0,
        awayShotsOnTarget: 0,
        homeFouls: 0,
        awayFouls: 0,
        homeCorners: 0,
        awayCorners: 0,
        homeYellowCards: 0,
        awayYellowCards: 0,
        homeRedCards: 0,
        awayRedCards: 0
      }
    }

    // Calculate initial team ratings
    let homeRatings = this.ratingsCalculator.calculateTeamRatings(homeTeam.players)
    let awayRatings = this.ratingsCalculator.calculateTeamRatings(awayTeam.players)

    // Apply tactical modifiers
    homeRatings = this.ratingsCalculator.applyTacticalModifiers(
      homeRatings,
      homeTeam.formation,
      homeTeam.aggression,
      homeTeam.pressure
    )
    awayRatings = this.ratingsCalculator.applyTacticalModifiers(
      awayRatings,
      awayTeam.formation,
      awayTeam.aggression,
      awayTeam.pressure
    )

    // Apply home advantage
    homeRatings = this.ratingsCalculator.applyHomeAdvantage(homeRatings, true)

    // Pre-match commentary
    result.commentary.push(...this.commentary.generatePreMatch(homeTeam.name, awayTeam.name))

    // Kickoff
    result.commentary.push(
      this.commentary.generateCommentary({
        type: 'kickoff',
        minute: 0,
        team: homeTeam.name
      })
    )

    // Simulate each minute
    for (let minute = 1; minute <= 90; minute++) {
      const minuteEvents = this.simulateMinute(
        minute,
        homeTeam,
        awayTeam,
        homeRatings,
        awayRatings,
        result
      )

      // Add events and commentary
      for (const event of minuteEvents) {
        result.events.push(event)
        
        // Generate commentary for the event
        const commentaryEvent: CommentaryEvent = {
          type: this.mapEventTypeToCommentary(event.type),
          minute: event.minute,
          player: event.playerName,
          team: event.team === 'home' ? homeTeam.name : awayTeam.name
        }
        
        result.commentary.push(this.commentary.generateCommentary(commentaryEvent))

        // Update score if goal
        if (event.type === 'goal') {
          if (event.team === 'home') {
            result.homeScore++
          } else {
            result.awayScore++
          }
          
          // Add score update
          result.commentary.push(
            this.commentary.generateScoreUpdate(
              homeTeam.name,
              awayTeam.name,
              result.homeScore,
              result.awayScore
            )
          )
        }
      }

      // Half time
      if (minute === 45) {
        result.commentary.push(
          this.commentary.generateCommentary({
            type: 'half_time',
            minute: 45
          })
        )
      }

      // Random general commentary
      if (minute % 10 === 0 && minuteEvents.length === 0) {
        if (this.rng.chance(0.3)) {
          result.commentary.push(
            this.commentary.generateCommentary({
              type: 'general',
              minute,
              team: this.rng.chance(0.5) ? homeTeam.name : awayTeam.name
            })
          )
        }
      }
    }

    // Full time
    result.commentary.push(
      this.commentary.generateCommentary({
        type: 'full_time',
        minute: 90
      })
    )

    // Post-match commentary
    result.commentary.push(
      ...this.commentary.generatePostMatch(
        homeTeam.name,
        awayTeam.name,
        result.homeScore,
        result.awayScore
      )
    )

    // Calculate final statistics
    this.calculateFinalStatistics(result, homeRatings, awayRatings)

    return result
  }

  /**
   * Simulate a single minute of play
   */
  private simulateMinute(
    minute: number,
    homeTeam: MatchTeam,
    awayTeam: MatchTeam,
    homeRatings: TeamRatings,
    awayRatings: TeamRatings,
    currentResult: MatchResult
  ): MatchEvent[] {
    const events: MatchEvent[] = []

    // Determine which team has possession based on midfield ratings
    const homeMidfieldAdvantage = homeRatings.midfield / (homeRatings.midfield + awayRatings.midfield)
    const hasHomePossession = this.rng.chance(homeMidfieldAdvantage)

    // Attack phase
    if (hasHomePossession) {
      currentResult.statistics.homePossession++
      
      // Check if attack succeeds
      const attackSuccess = this.calculateAttackSuccess(
        homeRatings.attack,
        awayRatings.defense
      )

      if (attackSuccess > 0.5) {
        // Shot on goal
        currentResult.statistics.homeShots++
        
        if (this.rng.chance(attackSuccess - 0.3)) {
          // Goal!
          currentResult.statistics.homeShotsOnTarget++
          const scorer = this.selectScorer(homeTeam.players, 'attack')
          
          events.push({
            minute,
            type: 'goal',
            playerId: scorer.id,
            playerName: scorer.name,
            team: 'home'
          })

          // Update player stats
          scorer.goalsSeason++
        } else if (this.rng.chance(0.3)) {
          // Shot on target but saved
          currentResult.statistics.homeShotsOnTarget++
        }
      } else if (attackSuccess > 0.4 && this.rng.chance(0.2)) {
        // Corner
        currentResult.statistics.homeCorners++
      }
    } else {
      currentResult.statistics.awayPossession++
      
      // Away team attack
      const attackSuccess = this.calculateAttackSuccess(
        awayRatings.attack,
        homeRatings.defense
      )

      if (attackSuccess > 0.5) {
        currentResult.statistics.awayShots++
        
        if (this.rng.chance(attackSuccess - 0.3)) {
          currentResult.statistics.awayShotsOnTarget++
          const scorer = this.selectScorer(awayTeam.players, 'attack')
          
          events.push({
            minute,
            type: 'goal',
            playerId: scorer.id,
            playerName: scorer.name,
            team: 'away'
          })

          scorer.goalsSeason++
        } else if (this.rng.chance(0.3)) {
          currentResult.statistics.awayShotsOnTarget++
        }
      } else if (attackSuccess > 0.4 && this.rng.chance(0.2)) {
        currentResult.statistics.awayCorners++
      }
    }

    // Check for fouls and cards
    const foulChance = (homeTeam.aggression + awayTeam.aggression) / 2000
    if (this.rng.chance(foulChance)) {
      const isHomeFoul = this.rng.chance(homeTeam.aggression / (homeTeam.aggression + awayTeam.aggression))
      
      if (isHomeFoul) {
        currentResult.statistics.homeFouls++
        
        // Check for card
        if (this.rng.chance(0.15)) {
          const player = this.rng.pick(homeTeam.players)
          
          if (player.yellowCards >= 1 && this.rng.chance(0.3)) {
            // Second yellow = red
            events.push({
              minute,
              type: 'red_card',
              playerId: player.id,
              playerName: player.name,
              team: 'home'
            })
            currentResult.statistics.homeRedCards++
            player.redCards++
            player.banMatches = 1
          } else {
            // Yellow card
            events.push({
              minute,
              type: 'yellow_card',
              playerId: player.id,
              playerName: player.name,
              team: 'home'
            })
            currentResult.statistics.homeYellowCards++
            player.yellowCards++
          }
        }
      } else {
        currentResult.statistics.awayFouls++
        
        if (this.rng.chance(0.15)) {
          const player = this.rng.pick(awayTeam.players)
          
          if (player.yellowCards >= 1 && this.rng.chance(0.3)) {
            events.push({
              minute,
              type: 'red_card',
              playerId: player.id,
              playerName: player.name,
              team: 'away'
            })
            currentResult.statistics.awayRedCards++
            player.redCards++
            player.banMatches = 1
          } else {
            events.push({
              minute,
              type: 'yellow_card',
              playerId: player.id,
              playerName: player.name,
              team: 'away'
            })
            currentResult.statistics.awayYellowCards++
            player.yellowCards++
          }
        }
      }
    }

    // Check for injuries (rare)
    if (this.rng.chance(0.001)) {
      const isHomeInjury = this.rng.chance(0.5)
      const team = isHomeInjury ? homeTeam : awayTeam
      const player = this.rng.pick(team.players)
      
      events.push({
        minute,
        type: 'injury',
        playerId: player.id,
        playerName: player.name,
        team: isHomeInjury ? 'home' : 'away'
      })

      player.isInjured = true
      player.injuryDays = this.rng.randomInt(3, 21)
    }

    // Update player fitness
    this.updatePlayerFitness(homeTeam.players, homeTeam.pressure)
    this.updatePlayerFitness(awayTeam.players, awayTeam.pressure)

    return events
  }

  /**
   * Calculate attack success probability
   */
  private calculateAttackSuccess(attackRating: number, defenseRating: number): number {
    const ratio = attackRating / (attackRating + defenseRating)
    // Add some randomness and boost attack slightly
    const randomFactor = this.rng.randomFloat(0.9, 1.3)
    const boostedRatio = ratio * 1.2 // Small boost to favor attacking
    return Math.min(0.95, Math.max(0.15, boostedRatio * randomFactor))
  }

  /**
   * Select a player to score based on position
   */
  private selectScorer(players: PlayerWithLineup[], preferredPosition: 'attack' | 'midfield'): PlayerWithLineup {
    const forwards = players.filter(p => p.position === 'FW')
    const midfielders = players.filter(p => p.position === 'MF')
    
    if (preferredPosition === 'attack' && forwards.length > 0) {
      // 80% chance forward scores
      if (this.rng.chance(0.8)) {
        return this.rng.pick(forwards)
      }
    }
    
    // Otherwise pick from all outfield players
    const outfield = players.filter(p => p.position !== 'GK')
    return this.rng.pick(outfield)
  }

  /**
   * Update player fitness based on match intensity
   */
  private updatePlayerFitness(players: PlayerWithLineup[], pressure: number): void {
    const baseFitnessLoss = 0.15 // Per minute
    const pressureModifier = 1 + (pressure / 200) // High pressure = more fitness loss
    
    for (const player of players) {
      player.fitness = Math.max(
        0,
        player.fitness - (baseFitnessLoss * pressureModifier)
      )
    }
  }

  /**
   * Calculate final match statistics
   */
  private calculateFinalStatistics(
    result: MatchResult,
    homeRatings: TeamRatings,
    awayRatings: TeamRatings
  ): void {
    // Convert possession counts to percentages
    const totalPossession = result.statistics.homePossession + result.statistics.awayPossession
    result.statistics.homePossession = Math.round((result.statistics.homePossession / totalPossession) * 100)
    result.statistics.awayPossession = 100 - result.statistics.homePossession
  }

  /**
   * Map internal event types to commentary types
   */
  private mapEventTypeToCommentary(eventType: string): CommentaryEvent['type'] {
    const mapping: Record<string, CommentaryEvent['type']> = {
      'goal': 'goal',
      'yellow_card': 'yellow_card',
      'red_card': 'red_card',
      'injury': 'injury',
      'substitution': 'substitution'
    }
    return mapping[eventType] || 'general'
  }
}