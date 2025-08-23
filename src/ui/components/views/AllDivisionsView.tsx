'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'

interface Division {
  id: string
  name: string
  level: number
  standings: Standing[]
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
  const { manager } = useGameStore()
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDivision, setSelectedDivision] = useState<number>(1)

  useEffect(() => {
    if (manager?.id) {
      loadAllDivisions()
    }
  }, [manager?.id])

  const loadAllDivisions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/game/all-divisions')
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

  const getDivisionColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-100 border-yellow-300'
      case 2: return 'bg-blue-100 border-blue-300'
      case 3: return 'bg-green-100 border-green-300'
      case 4: return 'bg-red-100 border-red-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const getPromotionRelegationStyle = (position: number, level: number) => {
    if (level === 1) {
      // Serie A: Top 3 get prizes, bottom 3 get relegated
      if (position <= 3) return 'bg-yellow-200 font-bold'
      if (position >= 8) return 'bg-red-200 font-bold'
    } else if (level === 4) {
      // Serie D: Top 3 get promoted, bottom 3 get eliminated
      if (position <= 3) return 'bg-green-200 font-bold'
      if (position >= 8) return 'bg-red-300 font-bold'
    } else {
      // Other divisions: Top 3 get promoted, bottom 3 get relegated
      if (position <= 3) return 'bg-green-200 font-bold'
      if (position >= 8) return 'bg-red-200 font-bold'
    }
    return ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🏆 Todas as Divisões</h2>
        <p className="text-gray-600">Acompanhe a classificação de todas as divisões</p>
      </div>

      {/* Division Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {divisions.map((division) => (
          <button
            key={division.id}
            onClick={() => setSelectedDivision(division.level)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedDivision === division.level
                ? getDivisionColor(division.level) + ' shadow-md'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {division.name}
          </button>
        ))}
      </div>

      {/* Selected Division Table */}
      {divisions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className={`p-4 ${getDivisionColor(selectedDivision)}`}>
            <h3 className="text-xl font-bold text-gray-800">
              {divisions.find(d => d.level === selectedDivision)?.name}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedDivision === 1 
                ? 'Top 3: Premiação | Bottom 3: Rebaixamento'
                : selectedDivision === 4
                ? 'Top 3: Promoção | Bottom 3: Eliminação'
                : 'Top 3: Promoção | Bottom 3: Rebaixamento'
              }
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clube
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    J
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    V
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    D
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GP
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SG
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {divisions
                  .find(d => d.level === selectedDivision)
                  ?.standings.map((standing) => (
                    <tr 
                      key={standing.id}
                      className={`hover:bg-gray-50 ${getPromotionRelegationStyle(standing.position, selectedDivision)}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {standing.position}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {standing.club.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.played}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.won}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.drawn}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.lost}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.goalsFor}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.goalsAgainst}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        {standing.goalsFor - standing.goalsAgainst}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {standing.points}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Legenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 mr-2"></div>
            <span>Promoção</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-200 mr-2"></div>
            <span>Premiação (Série A)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 mr-2"></div>
            <span>Rebaixamento</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-300 mr-2"></div>
            <span>Eliminação (Série D)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
