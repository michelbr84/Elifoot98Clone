'use client'

import { useGameStore } from '@/src/state/useGameStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGlobalShortcuts } from '@/src/hooks/useKeyboardShortcuts'
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
    isSimulating 
  } = useGameStore()
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const managerId = searchParams.get('managerId')
  
  // Enable keyboard shortcuts
  useGlobalShortcuts()

  const handleViewChange = (view: string) => {
    setSelectedView(view as any)
    router.push(`/game?managerId=${managerId}&view=${view}`)
  }

  const menuItems = [
    { id: 'home', label: 'INÍCIO', icon: '🏠' },
    { id: 'squad', label: 'ELENCO', icon: '👥' },
    { id: 'tactics', label: 'TÁTICA', icon: '📋' },
    { id: 'fixtures', label: 'JOGOS', icon: '⚽' },
    { id: 'table', label: 'TABELA', icon: '📊' },
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
    </div>
  )
}