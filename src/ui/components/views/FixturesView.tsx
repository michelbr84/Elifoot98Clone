'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import ptBr from 'dayjs/locale/pt-br'

dayjs.locale(ptBr)

interface Fixture {
  id: string
  roundNumber: number
  homeClub: { id: string; name: string; shortName: string }
  awayClub: { id: string; name: string; shortName: string }
  scheduledAt: string
  isPlayed: boolean
  match?: {
    homeScore: number
    awayScore: number
  }
}

interface FixturesViewProps {
  fixtures: Fixture[]
  currentRound: number
  clubId: string
}

export function FixturesView({ fixtures, currentRound, clubId }: FixturesViewProps) {
  const [selectedRound, setSelectedRound] = useState(currentRound)
  
  // Agrupa fixtures por rodada
  const fixturesByRound = fixtures.reduce((acc, fixture) => {
    if (!acc[fixture.roundNumber]) {
      acc[fixture.roundNumber] = []
    }
    acc[fixture.roundNumber].push(fixture)
    return acc
  }, {} as Record<number, Fixture[]>)

  const maxRound = Math.max(...Object.keys(fixturesByRound).map(Number))
  
  const renderFixture = (fixture: Fixture) => {
    const isMyTeam = fixture.homeClub.id === clubId || fixture.awayClub.id === clubId
    const homeWin = fixture.match && fixture.match.homeScore > fixture.match.awayScore
    const awayWin = fixture.match && fixture.match.awayScore > fixture.match.homeScore
    
    return (
      <tr key={fixture.id} className={isMyTeam ? 'bg-yellow-100' : ''}>
        <td className="text-center">
          {dayjs(fixture.scheduledAt).format('DD/MM')}
        </td>
        <td className="text-right pr-2">
          <span className={homeWin ? 'font-bold' : ''}>
            {fixture.homeClub.shortName}
          </span>
        </td>
        <td className="text-center font-mono">
          {fixture.isPlayed && fixture.match ? (
            <span>
              {fixture.match.homeScore} - {fixture.match.awayScore}
            </span>
          ) : (
            <span className="text-gray-500">vs</span>
          )}
        </td>
        <td className="text-left pl-2">
          <span className={awayWin ? 'font-bold' : ''}>
            {fixture.awayClub.shortName}
          </span>
        </td>
        <td className="text-center">
          {fixture.isPlayed ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <h2 className="text-2xl font-bold mb-4 font-mono">JOGOS</h2>
        
        {/* Seletor de Rodada */}
        <div className="mb-4 flex items-center gap-4">
          <button 
            className="btn-retro px-2 py-1"
            onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
            disabled={selectedRound === 1}
          >
            ←
          </button>
          
          <select 
            className="select-retro"
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
          >
            {Array.from({ length: maxRound }, (_, i) => i + 1).map(round => (
              <option key={round} value={round}>
                Rodada {round} {round === currentRound && '(Atual)'}
              </option>
            ))}
          </select>
          
          <button 
            className="btn-retro px-2 py-1"
            onClick={() => setSelectedRound(Math.min(maxRound, selectedRound + 1))}
            disabled={selectedRound === maxRound}
          >
            →
          </button>
        </div>

        {/* Tabela de Jogos */}
        <table className="table-retro w-full">
          <thead>
            <tr>
              <th>Data</th>
              <th className="text-right">Casa</th>
              <th className="text-center">Placar</th>
              <th className="text-left">Fora</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fixturesByRound[selectedRound]?.map(renderFixture) || (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  Nenhum jogo nesta rodada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Próximo Jogo do Time */}
      {(() => {
        const nextFixture = fixtures
          .filter(f => !f.isPlayed && (f.homeClub.id === clubId || f.awayClub.id === clubId))
          .sort((a, b) => a.roundNumber - b.roundNumber)[0]
        
        if (!nextFixture) return null
        
        const isHome = nextFixture.homeClub.id === clubId
        const opponent = isHome ? nextFixture.awayClub : nextFixture.homeClub
        
        return (
          <div className="card-retro">
            <h3 className="text-lg font-bold mb-2 font-mono">PRÓXIMO JOGO</h3>
            <div className="text-center">
              <p className="text-2xl font-bold mb-2">
                {isHome ? 'CASA' : 'FORA'} vs {opponent.name}
              </p>
              <p className="text-sm">
                Rodada {nextFixture.roundNumber} - {dayjs(nextFixture.scheduledAt).format('DD/MM/YYYY')}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Últimos Resultados */}
      <div className="card-retro">
        <h3 className="text-lg font-bold mb-2 font-mono">ÚLTIMOS 5 JOGOS</h3>
        <div className="flex gap-2 justify-center">
          {fixtures
            .filter(f => f.isPlayed && (f.homeClub.id === clubId || f.awayClub.id === clubId))
            .sort((a, b) => b.roundNumber - a.roundNumber)
            .slice(0, 5)
            .reverse()
            .map(fixture => {
              const isHome = fixture.homeClub.id === clubId
              const myScore = isHome ? fixture.match!.homeScore : fixture.match!.awayScore
              const theirScore = isHome ? fixture.match!.awayScore : fixture.match!.homeScore
              
              let result = 'E'
              let colorClass = 'bg-gray-400'
              if (myScore > theirScore) {
                result = 'V'
                colorClass = 'bg-green-500'
              } else if (myScore < theirScore) {
                result = 'D'
                colorClass = 'bg-red-500'
              }
              
              return (
                <div
                  key={fixture.id}
                  className={`w-8 h-8 ${colorClass} text-white flex items-center justify-center font-bold`}
                  title={`${myScore}-${theirScore} vs ${isHome ? fixture.awayClub.name : fixture.homeClub.name}`}
                >
                  {result}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}