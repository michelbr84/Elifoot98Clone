import { Player } from '@prisma/client'

export interface LineupValidation {
  isValid: boolean
  errors: string[]
  players: Player[]
}

export class LineupValidator {
  static validate(players: Player[], formation: string): LineupValidation {
    const errors: string[] = []
    
    // Filter available players (not injured or suspended)
    const availablePlayers = players.filter(p => !p.isInjured && p.banMatches === 0)
    
    // Check minimum players
    if (availablePlayers.length < 11) {
      errors.push(`Apenas ${availablePlayers.length} jogadores disponíveis (mínimo 11)`)
    }

    // Parse formation
    const [def, mid, att] = formation.split('-').map(Number)
    const requiredGK = 1
    const requiredDF = def
    const requiredMF = mid
    const requiredFW = att

    // Count available by position
    const positionCounts = {
      GK: availablePlayers.filter(p => p.position === 'GK').length,
      DF: availablePlayers.filter(p => p.position === 'DF').length,
      MF: availablePlayers.filter(p => p.position === 'MF').length,
      FW: availablePlayers.filter(p => p.position === 'FW').length,
    }

    // Validate positions
    if (positionCounts.GK < requiredGK) {
      errors.push(`Goleiro insuficiente (tem ${positionCounts.GK}, precisa ${requiredGK})`)
    }
    if (positionCounts.DF < requiredDF) {
      errors.push(`Defensores insuficientes (tem ${positionCounts.DF}, precisa ${requiredDF})`)
    }
    if (positionCounts.MF < requiredMF) {
      errors.push(`Meio-campistas insuficientes (tem ${positionCounts.MF}, precisa ${requiredMF})`)
    }
    if (positionCounts.FW < requiredFW) {
      errors.push(`Atacantes insuficientes (tem ${positionCounts.FW}, precisa ${requiredFW})`)
    }

    // Build best lineup
    const lineup: Player[] = []
    
    // Add goalkeeper
    const goalkeepers = availablePlayers
      .filter(p => p.position === 'GK')
      .sort((a, b) => b.overall - a.overall)
    if (goalkeepers[0]) lineup.push(goalkeepers[0])

    // Add defenders
    const defenders = availablePlayers
      .filter(p => p.position === 'DF')
      .sort((a, b) => b.overall - a.overall)
      .slice(0, requiredDF)
    lineup.push(...defenders)

    // Add midfielders
    const midfielders = availablePlayers
      .filter(p => p.position === 'MF')
      .sort((a, b) => b.overall - a.overall)
      .slice(0, requiredMF)
    lineup.push(...midfielders)

    // Add forwards
    const forwards = availablePlayers
      .filter(p => p.position === 'FW')
      .sort((a, b) => b.overall - a.overall)
      .slice(0, requiredFW)
    lineup.push(...forwards)

    // Fill remaining spots with best available players if needed
    if (lineup.length < 11) {
      const usedIds = new Set(lineup.map(p => p.id))
      const remaining = availablePlayers
        .filter(p => !usedIds.has(p.id))
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 11 - lineup.length)
      
      lineup.push(...remaining)
      
      if (lineup.length < 11) {
        errors.push('Não foi possível formar uma escalação completa')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      players: lineup.slice(0, 11)
    }
  }

  static getEmergencyLineup(players: Player[]): Player[] {
    // In extreme cases, use any available players
    const allAvailable = players
      .filter(p => p.fitness > 0) // Even injured players if necessary
      .sort((a, b) => {
        // Prioritize non-injured, then by overall
        if (a.isInjured !== b.isInjured) return a.isInjured ? 1 : -1
        if (a.banMatches !== b.banMatches) return a.banMatches - b.banMatches
        return b.overall - a.overall
      })
      .slice(0, 11)

    return allAvailable
  }
}