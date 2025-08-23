'use client'

import { useState } from 'react'
import { Player, Club } from '@prisma/client'
import { makeTransferOffer } from '@/app/game/actions'

interface TransfersViewProps {
  myClub: Club & { players: Player[] }
  otherClubs: (Club & { players: Player[] })[]
  budget: number
  recentTransfers?: any[]
}

type TabType = 'market' | 'myteam' | 'offers' | 'recent'

export function TransfersView({ myClub, otherClubs, budget, recentTransfers = [] }: TransfersViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('market')
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [offerAmount, setOfferAmount] = useState('')

  const formatCurrency = (value: number) => `§ ${value.toLocaleString('pt-BR')}`

  const calculatePlayerValue = (player: Player) => {
    // Base value on overall, age, and position
    let value = player.overall * 10000
    
    // Age factor
    if (player.age < 25) value *= 1.5
    else if (player.age > 30) value *= 0.8
    else if (player.age > 35) value *= 0.5
    
    // Position factor
    if (player.position === 'FW') value *= 1.2
    else if (player.position === 'GK') value *= 0.9
    
    return Math.round(value)
  }

  const getAvailablePlayers = () => {
    if (activeTab === 'myteam') {
      return myClub.players
    }
    
    let players: Player[] = []
    if (selectedClub) {
      const club = otherClubs.find(c => c.id === selectedClub)
      players = club?.players || []
    } else {
      players = otherClubs.flatMap(club => club.players)
    }
    
    // Apply filters
    if (searchTerm) {
      players = players.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (positionFilter !== 'all') {
      players = players.filter(p => p.position === positionFilter)
    }
    
    return players.sort((a, b) => b.overall - a.overall)
  }

  const handleMakeOffer = async () => {
    if (!selectedPlayer || !offerAmount) return
    
    setIsLoading(true)
    try {
      const amount = parseInt(offerAmount)
      if (amount > budget) {
        alert('Oferta excede o orçamento disponível!')
        return
      }
      
      // TODO: Implement server action
      await makeTransferOffer(myClub.id, selectedPlayer.id, amount)
      
      alert(`Oferta de ${formatCurrency(amount)} enviada por ${selectedPlayer.name}!`)
      setShowOfferModal(false)
      setSelectedPlayer(null)
      setOfferAmount('')
    } catch (error) {
      alert('Erro ao fazer oferta')
    } finally {
      setIsLoading(false)
    }
  }

  const availablePlayers = getAvailablePlayers()

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold font-mono">TRANSFERÊNCIAS</h2>
          <div className="text-lg font-mono">
            Orçamento: <span className={budget >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(budget)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'market' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setActiveTab('market')}
          >
            MERCADO
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'myteam' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setActiveTab('myteam')}
          >
            MEU ELENCO
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'offers' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setActiveTab('offers')}
          >
            OFERTAS (0)
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'recent' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setActiveTab('recent')}
          >
            RECENTES ({recentTransfers.length})
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar jogador..."
            className="input-retro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="select-retro"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="all">Todas as Posições</option>
            <option value="GK">Goleiro</option>
            <option value="DF">Defensor</option>
            <option value="MF">Meio-Campo</option>
            <option value="FW">Atacante</option>
          </select>
          
          {activeTab === 'market' && (
            <select
              className="select-retro"
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
            >
              <option value="">Todos os Clubes</option>
              {otherClubs.map(club => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Players List */}
        {activeTab === 'offers' ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma oferta pendente</p>
          </div>
        ) : activeTab === 'recent' ? (
          <div className="overflow-x-auto">
            <table className="table-retro w-full">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Jogador</th>
                  <th>De</th>
                  <th>Para</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Nenhuma transferência recente
                    </td>
                  </tr>
                ) : (
                  recentTransfers.map((transfer: any) => (
                    <tr key={transfer.id}>
                      <td>{new Date(transfer.transferDate).toLocaleDateString('pt-BR')}</td>
                      <td className="font-bold">{transfer.player.name}</td>
                      <td>{transfer.fromClub.shortName}</td>
                      <td>{transfer.toClub.shortName}</td>
                      <td className="text-right">{formatCurrency(transfer.fee)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-retro w-full">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Pos</th>
                  <th>Idade</th>
                  <th>Overall</th>
                  <th>Clube</th>
                  <th>Valor</th>
                  <th>Salário</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {availablePlayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      Nenhum jogador encontrado
                    </td>
                  </tr>
                ) : (
                  availablePlayers.map(player => {
                    const playerClub = player.clubId === myClub.id 
                      ? myClub 
                      : otherClubs.find(c => c.id === player.clubId)
                    
                    return (
                      <tr key={player.id}>
                        <td>{player.name}</td>
                        <td className="text-center">{player.position}</td>
                        <td className="text-center">{player.age}</td>
                        <td className="text-center font-bold">{player.overall}</td>
                        <td>{playerClub?.shortName || '-'}</td>
                        <td className="text-right">{formatCurrency(calculatePlayerValue(player))}</td>
                        <td className="text-right">{formatCurrency(player.wage)}/sem</td>
                        <td className="text-center">
                          {activeTab === 'market' ? (
                            <button
                              className="btn-retro text-sm"
                              onClick={() => {
                                setSelectedPlayer(player)
                                setOfferAmount(calculatePlayerValue(player).toString())
                                setShowOfferModal(true)
                              }}
                            >
                              OFERTAR
                            </button>
                          ) : (
                            <button
                              className="btn-retro text-sm"
                              onClick={() => {
                                if (confirm(`Colocar ${player.name} na lista de transferências?`)) {
                                  // TODO: Implement listing player
                                }
                              }}
                            >
                              LISTAR
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Tips */}
      <div className="card-retro">
        <h3 className="text-lg font-bold mb-2 font-mono">DICAS DE TRANSFERÊNCIA</h3>
        <ul className="space-y-1 text-sm">
          <li>• Jogadores jovens (≤25) têm maior potencial de valorização</li>
          <li>• Atacantes geralmente são mais caros que outras posições</li>
          <li>• Verifique o salário antes de contratar - impacta suas finanças</li>
          <li>• Venda jogadores com salários altos se estiver no vermelho</li>
          <li>• Janela de transferências: Janeiro e Julho/Agosto</li>
        </ul>
      </div>

      {/* Offer Modal */}
      {showOfferModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">FAZER OFERTA</h3>
            
            <div className="space-y-4">
              <div>
                <p className="font-bold">{selectedPlayer.name}</p>
                <p className="text-sm">
                  {selectedPlayer.position} | {selectedPlayer.age} anos | Overall {selectedPlayer.overall}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-mono mb-1">Valor da Oferta:</label>
                <input
                  type="number"
                  className="input-retro w-full"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  min="0"
                  max={budget}
                />
                <p className="text-xs mt-1">
                  Valor estimado: {formatCurrency(calculatePlayerValue(selectedPlayer))}
                </p>
              </div>
              
              <div>
                <p className="text-sm">Salário semanal: {formatCurrency(selectedPlayer.wage)}</p>
                <p className="text-sm">Contrato até: {new Date(selectedPlayer.contractEndsAt).getFullYear()}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={handleMakeOffer}
                  disabled={isLoading || !offerAmount || parseInt(offerAmount) <= 0}
                >
                  {isLoading ? 'ENVIANDO...' : 'CONFIRMAR'}
                </button>
                <button
                  className="btn-retro flex-1"
                  onClick={() => {
                    setShowOfferModal(false)
                    setSelectedPlayer(null)
                    setOfferAmount('')
                  }}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}