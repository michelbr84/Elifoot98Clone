'use client'

import { useState } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import { Player, Fixture, Standing } from '@prisma/client'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { advanceDay, playNextMatch } from '@/app/game/actions'
import { MatchResultView } from './MatchResultView'

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
  const { currentClub, currentDate, currentManager } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)
  const router = useRouter()

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
    setIsLoading(true)
    try {
      await advanceDay(currentManager.id, currentDate)
      router.refresh()
    } catch (error) {
      console.error('Erro ao avançar dia:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayMatch = async () => {
    if (!currentManager?.id || !nextFixture) return
    setIsLoading(true)
    try {
      const response = await playNextMatch(currentManager.id)
      setMatchResult(response.result)
      router.refresh()
    } catch (error) {
      console.error('Erro ao jogar partida:', error)
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
      <div className="card-retro">
        <h2 className="font-mono text-lg mb-4 uppercase">Ações Rápidas</h2>
        <div className="flex gap-2 flex-wrap">
          <button 
            className="btn-primary"
            onClick={handleAdvanceDay}
            disabled={isLoading}
          >
            {isLoading ? 'PROCESSANDO...' : 'AVANÇAR DIA'}
          </button>
          <button 
            className="btn-retro"
            onClick={handlePlayMatch}
            disabled={isLoading || !nextFixture}
          >
            JOGAR PRÓXIMA PARTIDA
          </button>
          <button 
            className="btn-retro"
            disabled={true}
            title="Em breve"
          >
            SIMULAR ATÉ PRÓXIMO JOGO
          </button>
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