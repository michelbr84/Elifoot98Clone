'use client'

import { Player } from '@prisma/client'
import { useState } from 'react'

interface SquadViewProps {
  players: Player[]
}

export function SquadView({ players }: SquadViewProps) {
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'position' | 'overall' | 'age' | 'value'>('position')

  // Filter players by position
  const filteredPlayers = selectedPosition === 'ALL' 
    ? players 
    : players.filter(p => p.position === selectedPosition)

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case 'overall':
        return b.overall - a.overall
      case 'age':
        return a.age - b.age
      case 'value':
        return b.value - a.value
      case 'position':
      default:
        const posOrder = { 'GK': 0, 'DF': 1, 'MF': 2, 'FW': 3 }
        return (posOrder[a.position as keyof typeof posOrder] || 0) - 
               (posOrder[b.position as keyof typeof posOrder] || 0)
    }
  })

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return 'text-retro-amber'
      case 'DF': return 'text-retro-blue'
      case 'MF': return 'text-retro-green'
      case 'FW': return 'text-retro-red'
      default: return ''
    }
  }

  const getStatusIcon = (player: Player) => {
    if (player.isInjured) return '🏥'
    if (player.banMatches > 0) return '🚫'
    if (player.fitness < 70) return '😰'
    if (player.morale < 40) return '😔'
    return ''
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">ELENCO</h1>

      {/* Filters */}
      <div className="card-retro">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="font-mono text-sm mr-2">POSIÇÃO:</label>
            <select 
              className="select-retro"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="ALL">TODAS</option>
              <option value="GK">GOLEIROS</option>
              <option value="DF">DEFENSORES</option>
              <option value="MF">MEIO-CAMPISTAS</option>
              <option value="FW">ATACANTES</option>
            </select>
          </div>
          
          <div>
            <label className="font-mono text-sm mr-2">ORDENAR:</label>
            <select 
              className="select-retro"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="position">POSIÇÃO</option>
              <option value="overall">HABILIDADE</option>
              <option value="age">IDADE</option>
              <option value="value">VALOR</option>
            </select>
          </div>
          
          <div className="font-mono text-sm">
            Total: {filteredPlayers.length} jogadores
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="card-retro overflow-x-auto">
        <table className="table-retro w-full">
          <thead>
            <tr>
              <th className="text-left">NOME</th>
              <th>POS</th>
              <th>IDADE</th>
              <th>NAC</th>
              <th>HAB</th>
              <th>FIT</th>
              <th>MORAL</th>
              <th>VALOR</th>
              <th>SALÁRIO</th>
              <th>GOLS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-retro-gray">
                <td className="font-bold">{player.name}</td>
                <td className={`text-center font-bold ${getPositionColor(player.position)}`}>
                  {player.position}
                </td>
                <td className="text-center">{player.age}</td>
                <td className="text-center">{player.nationality.substring(0, 3).toUpperCase()}</td>
                <td className="text-center font-bold">{player.overall}</td>
                <td className="text-center">
                  <span className={player.fitness < 70 ? 'text-retro-red' : ''}>
                    {player.fitness}%
                  </span>
                </td>
                <td className="text-center">
                  <span className={player.morale < 40 ? 'text-retro-red' : ''}>
                    {player.morale}%
                  </span>
                </td>
                <td className="text-right">§{player.value.toLocaleString('pt-BR')}</td>
                <td className="text-right">§{player.wage.toLocaleString('pt-BR')}</td>
                <td className="text-center">{player.goalsSeason}</td>
                <td className="text-center text-xl">{getStatusIcon(player)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Squad Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-retro">
          <h3 className="font-mono text-sm mb-2">ESTATÍSTICAS</h3>
          <div className="font-mono text-sm space-y-1">
            <div>Média HAB: {Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length)}</div>
            <div>Média Idade: {Math.round(players.reduce((sum, p) => sum + p.age, 0) / players.length)}</div>
            <div>Média FIT: {Math.round(players.reduce((sum, p) => sum + p.fitness, 0) / players.length)}%</div>
          </div>
        </div>
        
        <div className="card-retro">
          <h3 className="font-mono text-sm mb-2">VALOR DO ELENCO</h3>
          <div className="font-mono text-lg text-retro-green">
            §{players.reduce((sum, p) => sum + p.value, 0).toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div className="card-retro">
          <h3 className="font-mono text-sm mb-2">FOLHA SALARIAL</h3>
          <div className="font-mono text-lg text-retro-red">
            §{players.reduce((sum, p) => sum + p.wage, 0).toLocaleString('pt-BR')}/sem
          </div>
        </div>
      </div>
    </div>
  )
}