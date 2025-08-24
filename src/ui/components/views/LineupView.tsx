'use client'

import { Player } from '@prisma/client'
import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import { saveLineup } from '@/app/game/actions'

interface LineupViewProps {
  players: Player[]
}

// Position limits for lineup validation
const POSITION_LIMITS = { GK: 1, DF: 4, MF: 4, FW: 2 }

export function LineupView({ players }: LineupViewProps) {
  const { currentManager, currentLineup, setCurrentLineup } = useGameStore()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Get available players (not injured or suspended)
  const availablePlayers = players.filter(p => !p.isInjured && p.banMatches === 0)

  // Group players by position
  const playersByPosition = {
    GK: availablePlayers.filter(p => p.position === 'GK').sort((a, b) => b.overall - a.overall),
    DF: availablePlayers.filter(p => p.position === 'DF').sort((a, b) => b.overall - a.overall),
    MF: availablePlayers.filter(p => p.position === 'MF').sort((a, b) => b.overall - a.overall),
    FW: availablePlayers.filter(p => p.position === 'FW').sort((a, b) => b.overall - a.overall),
  }

  // Auto-select best players initially
  useEffect(() => {
    const newSelection: string[] = []

    // Select best 11 players (1 GK, 4 DF, 4 MF, 2 FW)
    const bestGK = playersByPosition.GK.slice(0, 1).map(p => p.id)
    const bestDF = playersByPosition.DF.slice(0, 4).map(p => p.id)
    const bestMF = playersByPosition.MF.slice(0, 4).map(p => p.id)
    const bestFW = playersByPosition.FW.slice(0, 2).map(p => p.id)

    newSelection.push(...bestGK, ...bestDF, ...bestMF, ...bestFW)
    setSelectedPlayers(newSelection)
  }, [players])

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

  const getPositionLimits = (position: string) => {
    return POSITION_LIMITS[position as keyof typeof POSITION_LIMITS] || 0
  }

    const handleSave = async () => {
    if (!currentManager?.id) return

    setSaving(true)
    try {
      const savedLineup = await saveLineup(currentManager.id, {
        formation: '4-4-2', // Default formation, tactics will override this
        playerIds: selectedPlayers
      })
      if (savedLineup.success && savedLineup.lineup) {
        setCurrentLineup(savedLineup.lineup)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      alert('Erro ao salvar escalação')
    } finally {
      setSaving(false)
    }
  }

  const isValidLineup = selectedPlayers.length === 11 &&
    ['GK', 'DF', 'MF', 'FW'].every(pos =>
      getSelectedCount(pos) === getPositionLimits(pos)
    )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">ESCALAÇÃO</h1>

      {/* Selection Status */}
      <div className="card-retro">
        <div className="flex items-center justify-between">
          <div className="font-mono text-sm">
            Selecionados: {selectedPlayers.length}/11
          </div>
          {isValidLineup && (
            <div className="text-green-600 font-mono text-sm">
              ✅ Escalação completa
            </div>
          )}
        </div>
      </div>

      {/* Position Requirements */}
      <div className="card-retro bg-blue-50">
        <div className="text-center font-mono mb-2 text-sm">
          REQUERIMENTOS POR POSIÇÃO:
        </div>
        <div className="text-center font-mono">
          {['GK', 'DF', 'MF', 'FW'].map(pos => (
            <span key={pos} className="mx-2">
              {pos}: {getSelectedCount(pos)}/{getPositionLimits(pos)}
              {getSelectedCount(pos) === getPositionLimits(pos) ? ' ✅' : ' ❌'}
            </span>
          ))}
        </div>
      </div>

      {/* Players by Position */}
      {Object.entries(playersByPosition).map(([position, posPlayers]) => {
        const requiredCount = getPositionLimits(position)
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
