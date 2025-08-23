'use client'

import { useState } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import { Player, Fixture, Standing } from '@prisma/client'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

import { MatchResultView } from './MatchResultView'
import { useSound } from '@/src/hooks/useSound'
import { NotificationManager } from '@/src/ui/components/Notification'

interface HomeViewProps {
  nextFixture?: Fixture & {
    homeClub: { name: string }
    awayClub: { name: string }
  }
  standing?: Standing & {
    club: { name: string }
  }
  injuredPlayers: Player[]
  suspendedPlayers: Player[]
}

export function HomeView({
  nextFixture,
  standing,
  injuredPlayers,
  suspendedPlayers
}: HomeViewProps) {
  const { currentClub, currentDate, currentManager, setCurrentDate } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)
  const router = useRouter()
  const { playClick, playSuccess, playError, playWhistle } = useSound()

  if (!currentClub || !currentManager) {
    return (
      <div className="card-retro p-8 text-center">
        <h1 className="text-2xl mb-4">BEM-VINDO AO FOOTMANAGER 98</h1>
        <p>Inicie um novo jogo ou carregue um jogo salvo</p>
      </div>
    )
  }

  const handleAdvanceDay = async () => {
    if (!currentManager?.id || !currentDate) return
    playClick()
    setIsLoading(true)
    try {
      const response = await fetch('/api/game/advance-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managerId: currentManager.id,
          currentDate: currentDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to advance day')
      }

      const data = await response.json()
      if (data.success) {
        // Update the current date in the store
        setCurrentDate(new Date(data.newDate))
        playSuccess()
        NotificationManager.success('Dia avançado com sucesso!')
        router.refresh()
      } else {
        throw new Error(data.error || 'Failed to advance day')
      }
    } catch (error) {
      console.error('Erro ao avançar dia:', error)
      playError()
      NotificationManager.error('Erro ao avançar dia. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayMatch = async () => {
    if (!currentManager?.id || !nextFixture) return
    playClick()
    playWhistle()
    setIsLoading(true)
    try {
      const response = await fetch('/api/game/play-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managerId: currentManager.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to play match')
      }

      const data = await response.json()
      if (data.success) {
        setMatchResult(data.result)
        // Play goal sound if there were goals
        if (data.result.homeScore > 0 || data.result.awayScore > 0) {
          playSuccess()
        }
        router.refresh()
      } else {
        throw new Error(data.error || 'Failed to play match')
      }
    } catch (error) {
      console.error('Erro ao jogar partida:', error)
      playError()
      NotificationManager.error('Erro ao jogar partida. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSimulateUntilMatch = async () => {
    if (!currentManager?.id || !nextFixture || !currentDate) return
    setIsLoading(true)
    try {
      // Calculate days until next match
      const daysUntilMatch = dayjs(nextFixture.scheduledAt).diff(dayjs(currentDate), 'day')
      
      if (daysUntilMatch <= 0) {
        // Match is today, just play it
        await handlePlayMatch()
        return
      }

      // Simulate multiple days using the API
      let currentSimDate = currentDate
      for (let i = 0; i < daysUntilMatch; i++) {
        const response = await fetch('/api/game/advance-day', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            managerId: currentManager.id,
            currentDate: currentSimDate
          })
        })

        if (!response.ok) {
          throw new Error('Failed to advance day during simulation')
        }

        const data = await response.json()
        if (data.success) {
          currentSimDate = new Date(data.newDate)
        } else {
          throw new Error(data.error || 'Failed to advance day during simulation')
        }
      }
      
      // Update the current date in the store
      setCurrentDate(currentSimDate)
      router.refresh()
      NotificationManager.success(`Simulados ${daysUntilMatch} dias até a próxima partida!`)
    } catch (error) {
      console.error('Erro ao simular:', error)
      NotificationManager.error('Erro ao simular dias. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-mono">DASHBOARD - {currentClub.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Club Info */}
        <div className="card-retro">
          <h2 className="font-mono text-lg mb-2 uppercase">Informações do Clube</h2>
          <div className="space-y-1 font-mono text-sm">
            <div>Estádio: {currentClub.stadium}</div>
            <div>Capacidade: {currentClub.capacity.toLocaleString('pt-BR')}</div>
            <div>Fundado: {currentClub.founded}</div>
            <div className="text-retro-green">
              Orçamento: §{currentClub.budget.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* League Position */}
        <div className="card-retro">
          <h2 className="font-mono text-lg mb-2 uppercase">Posição na Liga</h2>
          {standing ? (
            <div className="font-mono">
              <div className="text-3xl font-bold">{standing.position}º</div>
              <div className="text-sm space-y-1 mt-2">
                <div>P: {standing.points} | J: {standing.played}</div>
                <div>V: {standing.won} | E: {standing.drawn} | D: {standing.lost}</div>
                <div>GP: {standing.goalsFor} | GC: {standing.goalsAgainst}</div>
              </div>
            </div>
          ) : (
            <div>Temporada não iniciada</div>
          )}
        </div>

        {/* Next Match */}
        <div className="card-retro">
          <h2 className="font-mono text-lg mb-2 uppercase">Próximo Jogo</h2>
          {nextFixture ? (
            <div className="font-mono text-sm">
              <div className="font-bold">
                {nextFixture.homeClub.name} x {nextFixture.awayClub.name}
              </div>
              <div>{dayjs(nextFixture.scheduledAt).format('DD/MM/YYYY - HH:mm')}</div>
              <div className="mt-2">
                {nextFixture.homeClubId === currentClub.id ? '🏠 CASA' : '✈️ FORA'}
              </div>
            </div>
          ) : (
            <div>Nenhum jogo agendado</div>
          )}
        </div>

        {/* Squad Status */}
        <div className="card-retro">
          <h2 className="font-mono text-lg mb-2 uppercase">Status do Elenco</h2>
          <div className="font-mono text-sm space-y-2">
            {injuredPlayers.length > 0 && (
              <div className="text-retro-red">
                🏥 Lesionados: {injuredPlayers.length}
              </div>
            )}
            {suspendedPlayers.length > 0 && (
              <div className="text-retro-amber">
                🚫 Suspensos: {suspendedPlayers.length}
              </div>
            )}
            {injuredPlayers.length === 0 && suspendedPlayers.length === 0 && (
              <div className="text-retro-green">
                ✅ Elenco completo disponível
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-retro bg-yellow-100 border-4 border-yellow-600">
        <h2 className="font-mono text-xl mb-4 uppercase text-center">
          ⚡ AÇÕES PRINCIPAIS - CLIQUE AQUI PARA JOGAR! ⚡
        </h2>
        <div className="flex flex-col gap-3">
          <button 
            className="btn-primary text-lg p-4 animate-pulse hover:animate-none"
            onClick={handleAdvanceDay}
            disabled={isLoading}
            title="Avança um dia no calendário"
          >
            {isLoading ? '⏳ PROCESSANDO...' : '📅 AVANÇAR 1 DIA'}
          </button>
          {nextFixture && (
            <button 
              className="btn-success text-lg p-4"
              onClick={handlePlayMatch}
              disabled={isLoading}
              title="Simula a próxima partida do seu time"
            >
              ⚽ JOGAR PRÓXIMA PARTIDA
            </button>
          )}
          <button 
            className="btn-retro text-lg p-4"
            onClick={handleSimulateUntilMatch}
            disabled={isLoading || !nextFixture}
            title="Simula vários dias até a próxima partida"
          >
            ⏩ SIMULAR ATÉ PRÓXIMO JOGO
          </button>
        </div>
        <div className="mt-4 p-3 bg-white rounded border-2 border-black">
          <p className="text-sm font-bold">💡 COMO JOGAR:</p>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Clique em "AVANÇAR 1 DIA" para passar o tempo</li>
            <li>• Use "JOGAR PRÓXIMA PARTIDA" quando houver jogo</li>
            <li>• Gerencie seu time nas outras abas do menu</li>
          </ul>
        </div>
      </div>

      {/* Match Result Modal */}
      {matchResult && (
        <MatchResultView 
          matchResult={matchResult}
          onClose={() => setMatchResult(null)}
        />
      )}
    </div>
  )
}