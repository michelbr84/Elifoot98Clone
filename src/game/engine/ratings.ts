import { Player } from '@prisma/client'

export interface TeamRatings {
  defense: number
  midfield: number
  attack: number
  overall: number
  fitness: number
  morale: number
}

export interface PlayerWithLineup extends Player {
  position?: string // Position in lineup (might differ from natural position)
}

export class RatingsCalculator {
  /**
   * Calculate team ratings based on lineup
   */
  calculateTeamRatings(players: PlayerWithLineup[]): TeamRatings {
    const defenders = players.filter(p => 
      p.position === 'DF' || p.position === 'GK'
    )
    const midfielders = players.filter(p => p.position === 'MF')
    const attackers = players.filter(p => p.position === 'FW')

    // Calculate sector ratings
    const defense = this.calculateSectorRating(defenders, 'defense')
    const midfield = this.calculateSectorRating(midfielders, 'midfield')
    const attack = this.calculateSectorRating(attackers, 'attack')

    // Overall is weighted average
    const overall = (defense * 0.35 + midfield * 0.35 + attack * 0.3)

    // Calculate average fitness and morale
    const fitness = players.reduce((sum, p) => sum + p.fitness, 0) / players.length
    const morale = players.reduce((sum, p) => sum + p.morale, 0) / players.length

    return {
      defense,
      midfield,
      attack,
      overall,
      fitness,
      morale
    }
  }

  /**
   * Calculate rating for a specific sector
   */
  private calculateSectorRating(
    players: PlayerWithLineup[], 
    sector: 'defense' | 'midfield' | 'attack'
  ): number {
    if (players.length === 0) return 0

    // Base rating from player overalls
    let rating = players.reduce((sum, p) => sum + p.overall, 0) / players.length

    // Apply fitness modifier
    const avgFitness = players.reduce((sum, p) => sum + p.fitness, 0) / players.length
    rating *= (0.7 + 0.3 * (avgFitness / 100))

    // Apply form modifier
    const avgForm = players.reduce((sum, p) => sum + p.form, 0) / players.length
    rating *= (0.8 + 0.2 * (avgForm / 100))

    // Apply morale modifier
    const avgMorale = players.reduce((sum, p) => sum + p.morale, 0) / players.length
    rating *= (0.9 + 0.1 * (avgMorale / 100))

    // Position mismatch penalty
    for (const player of players) {
      if (this.isOutOfPosition(player, sector)) {
        rating *= 0.85 // 15% penalty for playing out of position
      }
    }

    return Math.round(rating)
  }

  /**
   * Check if player is playing out of their natural position
   */
  private isOutOfPosition(
    player: PlayerWithLineup, 
    sector: 'defense' | 'midfield' | 'attack'
  ): boolean {
    const naturalPosition = player.position
    const playingPosition = player.position // Could be overridden in lineup

    // Goalkeepers can only play in defense
    if (naturalPosition === 'GK' && sector !== 'defense') return true

    // Check sector mismatches
    if (sector === 'defense' && !['GK', 'DF'].includes(naturalPosition)) return true
    if (sector === 'midfield' && naturalPosition !== 'MF') return true
    if (sector === 'attack' && naturalPosition !== 'FW') return true

    return false
  }

  /**
   * Apply tactical modifiers to ratings
   */
  applyTacticalModifiers(
    ratings: TeamRatings,
    formation: string,
    aggression: number,
    pressure: number
  ): TeamRatings {
    const modified = { ...ratings }

    // Formation bonuses
    switch (formation) {
      case '5-3-2':
        modified.defense *= 1.15
        modified.attack *= 0.9
        break
      case '3-5-2':
        modified.midfield *= 1.1
        modified.defense *= 0.9
        break
      case '4-3-3':
        modified.attack *= 1.1
        modified.midfield *= 0.95
        break
      case '4-4-2':
        // Balanced, no modifiers
        break
    }

    // Aggression affects attack/defense balance
    const aggressionModifier = aggression / 100
    modified.attack *= (0.9 + 0.2 * aggressionModifier)
    modified.defense *= (1.1 - 0.2 * aggressionModifier)

    // Pressure affects midfield and fitness consumption
    const pressureModifier = pressure / 100
    modified.midfield *= (0.95 + 0.1 * pressureModifier)

    // Recalculate overall
    modified.overall = (
      modified.defense * 0.35 + 
      modified.midfield * 0.35 + 
      modified.attack * 0.3
    )

    return modified
  }

  /**
   * Calculate home advantage bonus
   */
  applyHomeAdvantage(ratings: TeamRatings, isHome: boolean): TeamRatings {
    if (!isHome) return ratings

    return {
      ...ratings,
      defense: ratings.defense * 1.05,
      midfield: ratings.midfield * 1.05,
      attack: ratings.attack * 1.05,
      overall: ratings.overall * 1.05,
      morale: Math.min(100, ratings.morale * 1.1)
    }
  }
}