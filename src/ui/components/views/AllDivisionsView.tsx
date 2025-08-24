'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'

interface Division {
  id: string
  name: string
  level: number
}

interface Standing {
  id: string
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  club: {
    id: string
    name: string
  }
}

export default function AllDivisionsView() {
  const { currentManager } = useGameStore()
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedDivision, setSelectedDivision] = useState<number>(1)
  const [currentStandings, setCurrentStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStandings, setLoadingStandings] = useState(false)

  // Load available divisions (lightweight)
  useEffect(() => {
    if (currentManager?.id) {
      loadDivisions()
    }
  }, [currentManager?.id])

  // Load standings when division changes
  useEffect(() => {
    if (selectedDivision && divisions.length > 0) {
      loadDivisionStandings(selectedDivision)
    }
  }, [selectedDivision, divisions])

  const loadDivisions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/game/divisions')
      if (response.ok) {
        const data = await response.json()
        setDivisions(data.divisions)
      }
    } catch (error) {
      console.error('Erro ao carregar divisões:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDivisionStandings = async (level: number) => {
    try {
      setLoadingStandings(true)
      const response = await fetch(`/api/game/division-standings?level=${level}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentStandings(data.standings)
      }
    } catch (error) {
      console.error('Erro ao carregar tabela:', error)
    } finally {
      setLoadingStandings(false)
    }
  }

  const getDivisionColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-retro-amber border-black'
      case 2: return 'bg-retro-blue border-black'
      case 3: return 'bg-retro-green border-black'
      case 4: return 'bg-retro-red border-black'
      default: return 'bg-retro-gray border-black'
    }
  }

  const getPromotionRelegationStyle = (position: number, level: number) => {
    if (level === 1) {
      // Serie A: Top 3 get nothing special (already champions league), bottom 3 get relegated
      if (position >= 10) return 'bg-retro-red text-white'
    } else if (level === 4) {
      // Serie D: Top 3 get promoted, positions 4-9 stay in same division, bottom 3 get eliminated
      if (position <= 3) return 'bg-retro-green text-white font-bold' // Promoção
      if (position >= 10) return 'bg-retro-dark text-white' // Eliminação
      if (position >= 4 && position <= 9) return 'bg-retro-gray text-black' // Permanecem na divisão
    } else {
      // Serie B e C: Top 3 get promoted, positions 4-9 stay in same division, bottom 3 get relegated
      if (position <= 3) return 'bg-retro-green text-white font-bold' // Promoção
      if (position >= 10) return 'bg-retro-red text-white' // Rebaixamento
      if (position >= 4 && position <= 9) return 'bg-retro-gray text-black' // Permanecem na divisão
    }
    return ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-xl animate-blink">CARREGANDO...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">TODAS AS DIVISÕES</h1>

      {/* Division Tabs */}
      <div className="flex flex-wrap gap-2">
        {divisions.map((division) => (
          <button
            key={division.id}
            onClick={() => setSelectedDivision(division.level)}
            className={`px-4 py-2 border-2 font-mono transition-colors ${
              selectedDivision === division.level
                ? getDivisionColor(division.level) + ' font-bold'
                : 'bg-white hover:bg-retro-gray border-black'
            }`}
          >
            {division.name}
          </button>
        ))}
      </div>

      {/* Selected Division Table */}
      {loadingStandings ? (
        <div className="card-retro p-8 text-center">
          <div className="font-mono animate-blink">CARREGANDO TABELA...</div>
        </div>
      ) : currentStandings.length > 0 ? (
        <div className="card-retro">
          <div className={`p-4 border-b-2 border-black ${getDivisionColor(selectedDivision)}`}>
            <h3 className="text-xl font-mono font-bold">
              {divisions.find(d => d.level === selectedDivision)?.name}
            </h3>
            <p className="font-mono text-sm mt-1">
              {selectedDivision === 1 
                ? 'Últimos 3: Rebaixamento'
                : selectedDivision === 4
                ? 'Top 3: Promoção | Últimos 3: Eliminação'
                : 'Top 3: Promoção | Últimos 3: Rebaixamento'
              }
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table-retro w-full">
              <thead>
                <tr>
                  <th>POS</th>
                  <th className="text-left">CLUBE</th>
                  <th>J</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>GP</th>
                  <th>GC</th>
                  <th>SG</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {currentStandings.map((standing) => (
                  <tr 
                    key={standing.id}
                    className={getPromotionRelegationStyle(standing.position, selectedDivision)}
                  >
                    <td className="text-center font-bold">{standing.position}</td>
                    <td>{standing.club.name}</td>
                    <td className="text-center">{standing.played}</td>
                    <td className="text-center">{standing.won}</td>
                    <td className="text-center">{standing.drawn}</td>
                    <td className="text-center">{standing.lost}</td>
                    <td className="text-center">{standing.goalsFor}</td>
                    <td className="text-center">{standing.goalsAgainst}</td>
                    <td className="text-center">{standing.goalsFor - standing.goalsAgainst}</td>
                    <td className="text-center font-bold">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-retro p-8 text-center">
          <div className="font-mono">Nenhum dado disponível</div>
        </div>
      )}

      {/* Legend */}
      <div className="card-retro">
        <h4 className="font-mono font-bold mb-2">LEGENDA:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-retro-green border border-black mr-2"></div>
            <span>Promoção</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-retro-red border border-black mr-2"></div>
            <span>Rebaixamento</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-retro-dark border border-black mr-2"></div>
            <span>Eliminação (Série D)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-retro-gray border border-black mr-2"></div>
            <span>Permanecem na Divisão</span>
          </div>
        </div>
      </div>
    </div>
  )
}
