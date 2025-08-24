'use client'

import { useGameStore } from '@/src/state/useGameStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGlobalShortcuts } from '@/src/hooks/useKeyboardShortcuts'
import { TutorialOverlay } from './TutorialOverlay'
import ManagerFiredDialog from './ManagerFiredDialog'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import ptBr from 'dayjs/locale/pt-br'

dayjs.locale(ptBr)

interface GameLayoutProps {
  children: React.ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  const {
    currentClub,
    currentDate,
    selectedView,
    setSelectedView,
    isSimulating,
    isManagerFired,
    setManagerFired,
    setCurrentManager,
    setCurrentClub,
    setCurrentSeason,
    setCurrentDate,
    setCurrentTactic,
    setCurrentLineup
  } = useGameStore()
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const managerId = searchParams.get('managerId')
  
  // Enable keyboard shortcuts
  useGlobalShortcuts()

  // Initialize game state when component mounts
  useEffect(() => {
    const initializeGameState = async () => {
      if (!managerId) return
      
      try {
        const response = await fetch(`/api/game/init?managerId=${managerId}`)
        if (response.ok) {
          const gameData = await response.json()

          setCurrentManager(gameData.manager)
          setCurrentClub(gameData.club)
          setCurrentSeason(gameData.season)
          setCurrentDate(new Date(gameData.currentDate || new Date()))

          // Set active tactic and lineup from manager data
          if (gameData.manager.tactics && gameData.manager.tactics.length > 0) {
            const activeTactic = gameData.manager.tactics.find(t => t.isActive)
            if (activeTactic) {
              setCurrentTactic(activeTactic)
            }
          }
          if (gameData.manager.lineups && gameData.manager.lineups.length > 0) {
            const activeLineup = gameData.manager.lineups.find(l => l.isActive)
            if (activeLineup) {
              setCurrentLineup(activeLineup)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing game state:', error)
      }
    }

    initializeGameState()
  }, [managerId, setCurrentManager, setCurrentClub, setCurrentSeason, setCurrentDate, setCurrentTactic, setCurrentLineup])

  const handleViewChange = (view: string) => {
    setSelectedView(view as any)
    router.push(`/game?managerId=${managerId}&view=${view}`)
  }

  const handleNewClubSelection = async (clubId: string) => {
    try {
      const response = await fetch('/api/game/assign-new-club', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managerId: managerId,
          clubId: clubId
        })
      })

      if (response.ok) {
        // Refresh game data
        const gameResponse = await fetch(`/api/game/init?managerId=${managerId}`)
        if (gameResponse.ok) {
          const gameData = await gameResponse.json()
          setCurrentManager(gameData.manager)
          setCurrentClub(gameData.club)
          setCurrentSeason(gameData.season)
          setCurrentDate(new Date(gameData.currentDate || new Date()))
        }
        setManagerFired(false)
      }
    } catch (error) {
      console.error('Erro ao atribuir novo clube:', error)
    }
  }

  const menuItems = [
    { id: 'home', label: 'INÍCIO', icon: '🏠' },
    { id: 'squad', label: 'ELENCO', icon: '👥' },
    { id: 'lineup', label: 'ESCALAÇÃO', icon: '⚽' },
    { id: 'tactics', label: 'TÁTICA', icon: '📋' },
    { id: 'fixtures', label: 'JOGOS', icon: '📅' },
    { id: 'table', label: 'TABELA', icon: '📊' },
    { id: 'all-divisions', label: 'TODAS AS DIVISÕES', icon: '🏆' },
    { id: 'transfers', label: 'TRANSFERÊNCIAS', icon: '💰' },
    { id: 'training', label: 'TREINO', icon: '🏃' },
    { id: 'finance', label: 'FINANÇAS', icon: '💵' },
    { id: 'news', label: 'NOTÍCIAS', icon: '📰' },
    { id: 'saves', label: 'SALVAR/CARREGAR', icon: '💾' },
    { id: 'settings', label: 'CONFIGURAÇÕES', icon: '⚙️' },
  ] as const

  return (
    <div className="min-h-screen bg-retro-bg">
      {/* Top Bar */}
      <div className="bg-retro-dark text-white p-2 flex justify-between items-center border-b-2 border-black">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm">
            {currentClub?.name || 'FOOTMANAGER 98'}
          </span>
          {currentClub && (
            <span className={`font-mono text-sm font-bold ${currentClub.budget >= 0 ? 'text-retro-green' : 'text-retro-red'}`}>
              §{currentClub.budget.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
        <div className="bg-white text-black px-3 py-1 rounded font-mono text-sm font-bold">
          📅 {dayjs(currentDate).format('DD [de] MMMM [de] YYYY')}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Menu */}
        <div className="w-64 bg-white border-r-2 border-black min-h-[calc(100vh-40px)]">
          <nav className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                disabled={isSimulating}
                className={`
                  menu-item w-full text-left flex items-center gap-2
                  ${selectedView === item.id ? 'menu-item-active' : ''}
                  ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {isSimulating && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card-retro p-8 text-center">
                <div className="text-2xl mb-4 animate-blink">SIMULANDO...</div>
                <div className="font-mono">Por favor, aguarde</div>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
      
      {/* Tutorial */}
      <TutorialOverlay />
      
      {/* Manager Fired Dialog */}
      <ManagerFiredDialog
        isOpen={isManagerFired}
        onClose={() => setManagerFired(false)}
        onClubSelected={handleNewClubSelection}
      />
    </div>
  )
}