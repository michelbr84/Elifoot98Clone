'use client'

import { Standing, Club } from '@prisma/client'
import { useGameStore } from '@/src/state/useGameStore'

interface TableViewProps {
  standings: (Standing & {
    club: Club
  })[]
  divisionName: string
}

export function TableView({ standings, divisionName }: TableViewProps) {
  const { currentClub } = useGameStore()

  const getRowClass = (standing: Standing & { club: Club }, index: number) => {
    const isMyClub = standing.club.id === currentClub?.id
    const isPromotion = index < 3
    const isRelegation = index >= standings.length - 3
    
    if (isMyClub) return 'bg-retro-blue text-white font-bold'
    if (isPromotion) return 'bg-green-100'
    if (isRelegation) return 'bg-red-100'
    return ''
  }

  const getPositionIcon = (position: number) => {
    if (position <= 3) return '↗️'
    if (position > standings.length - 3) return '↘️'
    return ''
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">{divisionName} - CLASSIFICAÇÃO</h1>

      <div className="card-retro overflow-x-auto">
        <table className="table-retro w-full">
          <thead>
            <tr>
              <th className="text-center w-12">#</th>
              <th className="text-left">CLUBE</th>
              <th className="text-center">J</th>
              <th className="text-center">V</th>
              <th className="text-center">E</th>
              <th className="text-center">D</th>
              <th className="text-center">GP</th>
              <th className="text-center">GC</th>
              <th className="text-center">SG</th>
              <th className="text-center font-bold">PTS</th>
              <th className="text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => {
              const goalDiff = standing.goalsFor - standing.goalsAgainst
              const performance = standing.played > 0 
                ? Math.round((standing.points / (standing.played * 3)) * 100)
                : 0
                
              return (
                <tr key={standing.id} className={getRowClass(standing, index)}>
                  <td className="text-center">
                    {standing.position} {getPositionIcon(standing.position)}
                  </td>
                  <td>
                    {standing.club.name}
                    {standing.club.id === currentClub?.id && ' (VOCÊ)'}
                  </td>
                  <td className="text-center">{standing.played}</td>
                  <td className="text-center">{standing.won}</td>
                  <td className="text-center">{standing.drawn}</td>
                  <td className="text-center">{standing.lost}</td>
                  <td className="text-center">{standing.goalsFor}</td>
                  <td className="text-center">{standing.goalsAgainst}</td>
                  <td className={`text-center font-bold ${
                    goalDiff > 0 ? 'text-retro-green' : 
                    goalDiff < 0 ? 'text-retro-red' : ''
                  }`}>
                    {goalDiff > 0 ? '+' : ''}{goalDiff}
                  </td>
                  <td className="text-center font-bold text-lg">{standing.points}</td>
                  <td className="text-center">{performance}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-black"></div>
          <span>Promoção</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-black"></div>
          <span>Rebaixamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-retro-blue border border-black"></div>
          <span>Seu clube</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-retro">
          <h3 className="font-mono text-sm mb-2">ARTILHARIA</h3>
          <div className="font-mono text-sm">
            <div>🥇 Jogador A - 15 gols</div>
            <div>🥈 Jogador B - 12 gols</div>
            <div>🥉 Jogador C - 10 gols</div>
          </div>
        </div>
        
        <div className="card-retro">
          <h3 className="font-mono text-sm mb-2">MELHOR ATAQUE</h3>
          <div className="font-mono text-sm">
            {standings.slice(0, 3)
              .sort((a, b) => b.goalsFor - a.goalsFor)
              .map((s, i) => (
                <div key={s.id}>
                  {i + 1}. {s.club.name} - {s.goalsFor} gols
                </div>
              ))}
          </div>
        </div>
        
        <div className="card-retro">
          <h3 className="font-mono text-sm mb-2">MELHOR DEFESA</h3>
          <div className="font-mono text-sm">
            {standings.slice(0, 3)
              .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
              .map((s, i) => (
                <div key={s.id}>
                  {i + 1}. {s.club.name} - {s.goalsAgainst} gols sofridos
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}