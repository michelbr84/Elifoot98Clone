'use client'

interface MatchEvent {
  minute: number
  type: string
  player?: { name: string }
  detail?: any
}

interface MatchResult {
  homeClub: { name: string; shortName: string }
  awayClub: { name: string; shortName: string }
  homeScore: number
  awayScore: number
  events: MatchEvent[]
  commentary: string[]
}

interface MatchResultViewProps {
  matchResult: MatchResult
  onClose: () => void
}

export function MatchResultView({ matchResult, onClose }: MatchResultViewProps) {
  const { homeClub, awayClub, homeScore, awayScore, events, commentary } = matchResult

  const goalEvents = events.filter(e => e.type === 'goal')
  const cardEvents = events.filter(e => ['yellowCard', 'redCard'].includes(e.type))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-retro-dark text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-mono">RESULTADO DA PARTIDA</h2>
          <button onClick={onClose} className="text-2xl hover:text-retro-green">
            ✕
          </button>
        </div>

        {/* Score */}
        <div className="p-6 border-b-2 border-black bg-retro-bg">
          <div className="flex items-center justify-center gap-8 text-4xl font-bold">
            <div className="text-center">
              <div className="text-lg font-normal mb-2">{homeClub.name}</div>
              <div className={homeScore > awayScore ? 'text-retro-green' : ''}>
                {homeScore}
              </div>
            </div>
            <div className="text-2xl">-</div>
            <div className="text-center">
              <div className="text-lg font-normal mb-2">{awayClub.name}</div>
              <div className={awayScore > homeScore ? 'text-retro-green' : ''}>
                {awayScore}
              </div>
            </div>
          </div>
        </div>

        {/* Events Summary */}
        <div className="p-4 border-b-2 border-black">
          <div className="grid grid-cols-2 gap-4">
            {/* Goals */}
            <div>
              <h3 className="font-mono text-sm uppercase mb-2">⚽ Gols</h3>
              {goalEvents.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {goalEvents.map((event, idx) => (
                    <li key={idx}>
                      {event.minute}' - {event.player?.name || 'Jogador'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum gol</p>
              )}
            </div>

            {/* Cards */}
            <div>
              <h3 className="font-mono text-sm uppercase mb-2">🟨🟥 Cartões</h3>
              {cardEvents.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {cardEvents.map((event, idx) => (
                    <li key={idx}>
                      {event.minute}' - 
                      {event.type === 'yellowCard' ? '🟨' : '🟥'} 
                      {event.player?.name || 'Jogador'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum cartão</p>
              )}
            </div>
          </div>
        </div>

        {/* Commentary */}
        <div className="p-4 overflow-y-auto max-h-64">
          <h3 className="font-mono text-sm uppercase mb-2">📢 Comentários</h3>
          <div className="bg-retro-gray p-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {commentary.map((comment, idx) => (
              <div key={idx} className="text-black">
                {comment}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-retro-bg border-t-2 border-black">
          <button 
            onClick={onClose}
            className="btn-primary w-full"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  )
}