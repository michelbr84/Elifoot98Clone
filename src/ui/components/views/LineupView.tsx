'use client'

import { Player } from '@prisma/client'
import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import { saveLineup } from '@/app/game/actions'

interface LineupViewProps {
  players: Player[]
}

const FORMATIONS = [
  { value: '4-4-2', label: '4-4-2', positions: { GK: 1, DF: 4, MF: 4, FW: 2 } },
  { value: '4-3-3', label: '4-3-3', positions: { GK: 1, DF: 4, MF: 3, FW: 3 } },
  { value: '3-5-2', label: '3-5-2', positions: { GK: 1, DF: 3, MF: 5, FW: 2 } },
  { value: '5-3-2', label: '5-3-2', positions: { GK: 1, DF: 5, MF: 3, FW: 2 } },
]

export function LineupView({ players }: LineupViewProps) {
  const { currentManager } = useGameStore()
  const [formation, setFormation] = useState('4-4-2')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Get available players (not injured or suspended)
  const availablePlayers = players.filter(p => !p.isInjured && p.banMatches === 0)
  
  // Get formation requirements
  const currentFormation = FORMATIONS.find(f => f.value === formation)!
  
  // Group players by position
  const playersByPosition = {
    GK: availablePlayers.filter(p => p.position === 'GK').sort((a, b) => b.overall - a.overall),
    DF: availablePlayers.filter(p => p.position === 'DF').sort((a, b) => b.overall - a.overall),
    MF: availablePlayers.filter(p => p.position === 'MF').sort((a, b) => b.overall - a.overall),
    FW: availablePlayers.filter(p => p.position === 'FW').sort((a, b) => b.overall - a.overall),
  }

  // Auto-select best players when formation changes
  useEffect(() => {
    const newSelection: string[] = []
    
    // Select best players for each position
    Object.entries(currentFormation.positions).forEach(([pos, count]) => {
      const posPlayers = playersByPosition[pos as keyof typeof playersByPosition]
      const selected = posPlayers.slice(0, count).map(p => p.id)
      newSelection.push(...selected)
    })
    
    setSelectedPlayers(newSelection)
  }, [formation, players])

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId))
    } else if (selectedPlayers.length < 11) {
      setSelectedPlayers(prev => [...prev, playerId])
    }
  }

  const isPlayerSelected = (playerId: string) => selectedPlayers.includes(playerId)

  const getSelectedCount = (position: string) => {
    return selectedPlayers.filter(id => 
      players.find(p => p.id === id)?.position === position
    ).length
  }

  const handleSave = async () => {
    if (!currentManager?.id) return
    
    setSaving(true)
    try {
      await saveLineup(currentManager.id, {
        formation,
        playerIds: selectedPlayers
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      alert('Erro ao salvar escalação')
    } finally {
      setSaving(false)
    }
  }

  const isValidLineup = selectedPlayers.length === 11 && 
    Object.entries(currentFormation.positions).every(([pos, count]) => 
      getSelectedCount(pos) === count
    )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">ESCALAÇÃO</h1>

      {/* Formation Selector */}
      <div className="card-retro">
        <div className="flex items-center gap-4">
          <label className="font-mono">FORMAÇÃO:</label>
          <select 
            className="select-retro"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
          >
            {FORMATIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          
          <div className="ml-auto font-mono text-sm">
            Selecionados: {selectedPlayers.length}/11
          </div>
        </div>
      </div>

      {/* Formation Visual */}
      <div className="card-retro bg-green-100">
        <div className="text-center font-mono mb-4">
          {Object.entries(currentFormation.positions).map(([pos, count]) => (
            <span key={pos} className="mx-2">
              {pos}: {getSelectedCount(pos)}/{count}
              {getSelectedCount(pos) === count ? ' ✅' : ' ❌'}
            </span>
          ))}
        </div>
      </div>

      {/* Players by Position */}
      {Object.entries(playersByPosition).map(([position, posPlayers]) => {
        const requiredCount = currentFormation.positions[position as keyof typeof currentFormation.positions]
        if (requiredCount === 0) return null
        
        return (
          <div key={position} className="card-retro">
            <h3 className="font-mono text-lg mb-3">
              {position === 'GK' ? 'GOLEIROS' : 
               position === 'DF' ? 'DEFENSORES' :
               position === 'MF' ? 'MEIO-CAMPISTAS' : 'ATACANTES'}
              <span className="text-sm ml-2">
                (Selecione {requiredCount})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {posPlayers.map(player => {
                const isSelected = isPlayerSelected(player.id)
                const canSelect = !isSelected && getSelectedCount(position) < requiredCount
                
                return (
                  <div
                    key={player.id}
                    onClick={() => (isSelected || canSelect) && togglePlayer(player.id)}
                    className={`p-2 border-2 rounded cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-green-200 border-green-600' 
                        : canSelect
                        ? 'hover:bg-gray-100 border-gray-400'
                        : 'opacity-50 cursor-not-allowed border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-mono font-bold">{player.name}</div>
                        <div className="font-mono text-sm">
                          HAB: {player.overall} | FIT: {player.fitness}% | {player.age} anos
                        </div>
                      </div>
                      <div className="text-2xl">
                        {isSelected ? '✅' : '⬜'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Save Button */}
      <div className="flex gap-4">
        <button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={!isValidLineup || saving}
        >
          {saving ? 'SALVANDO...' : 'SALVAR ESCALAÇÃO'}
        </button>
        {saved && <span className="text-green-600 font-mono self-center">✓ Salvo!</span>}
        {!isValidLineup && (
          <span className="text-red-600 font-mono self-center text-sm">
            Selecione exatamente os jogadores necessários para cada posição
          </span>
        )}
      </div>

      {/* Info */}
      <div className="card-retro">
        <h3 className="font-mono text-sm mb-2">INFORMAÇÕES</h3>
        <ul className="font-mono text-sm space-y-1">
          <li>• Jogadores lesionados 🏥 e suspensos 🚫 não podem ser selecionados</li>
          <li>• A escalação é aplicada automaticamente no próximo jogo</li>
          <li>• Jogadores com baixa forma física podem ter desempenho reduzido</li>
          <li>• A formação deve corresponder à tática selecionada</li>
        </ul>
      </div>
    </div>
  )
}