'use client'

import { useState } from 'react'
import { Player } from '@prisma/client'
import { applyTraining } from '@/app/game/actions'
import { useRouter } from 'next/navigation'

interface TrainingViewProps {
  players: Player[]
}

type TrainingType = 'fitness' | 'form' | 'recovery' | 'intensive'

export function TrainingView({ players }: TrainingViewProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [trainingType, setTrainingType] = useState<TrainingType>('fitness')
  const [isTraining, setIsTraining] = useState(false)
  const router = useRouter()

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(players.map(p => p.id))
    }
  }

  const handleSelectPlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    } else {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const handleTrain = async () => {
    if (selectedPlayers.length === 0) {
      alert('Selecione pelo menos um jogador para treinar!')
      return
    }

    setIsTraining(true)
    try {
      await applyTraining(selectedPlayers, trainingType)
      alert(`Treino concluído! ${selectedPlayers.length} jogadores treinados.`)
      setSelectedPlayers([])
      router.refresh()
    } catch (error) {
      alert('Erro ao aplicar treino')
    } finally {
      setIsTraining(false)
    }
  }

  const getTrainingEffect = (type: TrainingType) => {
    switch (type) {
      case 'fitness':
        return 'Fitness +10, Forma +5'
      case 'form':
        return 'Forma +15, Fitness +5'
      case 'recovery':
        return 'Fitness +20 (apenas lesionados)'
      case 'intensive':
        return 'Forma +20, Fitness -10'
    }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isInjured && !b.isInjured) return -1
    if (!a.isInjured && b.isInjured) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <h2 className="text-2xl font-bold mb-4 font-mono">TREINOS</h2>
        
        {/* Training Type Selection */}
        <div className="mb-6">
          <h3 className="font-mono text-sm uppercase mb-2">Tipo de Treino:</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`p-3 border-2 border-black ${
                trainingType === 'fitness' ? 'bg-retro-green text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setTrainingType('fitness')}
            >
              <div className="font-bold">FÍSICO</div>
              <div className="text-xs">{getTrainingEffect('fitness')}</div>
            </button>
            <button
              className={`p-3 border-2 border-black ${
                trainingType === 'form' ? 'bg-retro-green text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setTrainingType('form')}
            >
              <div className="font-bold">TÁTICO</div>
              <div className="text-xs">{getTrainingEffect('form')}</div>
            </button>
            <button
              className={`p-3 border-2 border-black ${
                trainingType === 'recovery' ? 'bg-retro-green text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setTrainingType('recovery')}
            >
              <div className="font-bold">RECUPERAÇÃO</div>
              <div className="text-xs">{getTrainingEffect('recovery')}</div>
            </button>
            <button
              className={`p-3 border-2 border-black ${
                trainingType === 'intensive' ? 'bg-retro-green text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setTrainingType('intensive')}
            >
              <div className="font-bold">INTENSIVO</div>
              <div className="text-xs">{getTrainingEffect('intensive')}</div>
            </button>
          </div>
        </div>

        {/* Player Selection */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-mono text-sm uppercase">Selecionar Jogadores:</h3>
            <button
              className="btn-retro text-sm"
              onClick={handleSelectAll}
            >
              {selectedPlayers.length === players.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto border-2 border-black">
            <table className="table-retro w-full">
              <thead className="sticky top-0">
                <tr>
                  <th className="w-12">✓</th>
                  <th>Nome</th>
                  <th>Pos</th>
                  <th>Fitness</th>
                  <th>Forma</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr 
                    key={player.id}
                    className={`cursor-pointer hover:bg-gray-100 ${
                      player.isInjured ? 'bg-red-50' : ''
                    }`}
                    onClick={() => handleSelectPlayer(player.id)}
                  >
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{player.name}</td>
                    <td className="text-center">{player.position}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{player.fitness}</span>
                        <div className="w-16 h-2 bg-gray-200 border border-black">
                          <div 
                            className={`h-full ${
                              player.fitness >= 80 ? 'bg-green-500' :
                              player.fitness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${player.fitness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{player.form}</span>
                        <div className="w-16 h-2 bg-gray-200 border border-black">
                          <div 
                            className={`h-full ${
                              player.form >= 80 ? 'bg-green-500' :
                              player.form >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${player.form}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      {player.isInjured ? (
                        <span className="text-red-600">🏥 {player.injuryDays}d</span>
                      ) : player.banMatches > 0 ? (
                        <span className="text-orange-600">🟥 {player.banMatches}j</span>
                      ) : (
                        <span className="text-green-600">✅</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-mono">{selectedPlayers.length}</span> jogador(es) selecionado(s)
          </div>
          <button
            className="btn-primary"
            onClick={handleTrain}
            disabled={isTraining || selectedPlayers.length === 0}
          >
            {isTraining ? 'TREINANDO...' : 'INICIAR TREINO'}
          </button>
        </div>
      </div>

      {/* Training Tips */}
      <div className="card-retro">
        <h3 className="text-lg font-bold mb-2 font-mono">DICAS DE TREINO</h3>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Físico:</strong> Melhora condicionamento para jogos</li>
          <li>• <strong>Tático:</strong> Aumenta entrosamento e forma</li>
          <li>• <strong>Recuperação:</strong> Ideal para jogadores lesionados</li>
          <li>• <strong>Intensivo:</strong> Ganho rápido mas cansativo</li>
          <li className="mt-2">⚠️ Jogadores com fitness baixo têm mais chance de lesão</li>
          <li>⚠️ Treinos intensivos devem ser usados com moderação</li>
        </ul>
      </div>
    </div>
  )
}