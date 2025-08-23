import { redirect } from 'next/navigation'
import { GameLayout } from '@/src/ui/components/GameLayout'
import { HomeView } from '@/src/ui/components/views/HomeView'
import { SquadView } from '@/src/ui/components/views/SquadView'
import { TableView } from '@/src/ui/components/views/TableView'
import { SavesView } from '@/src/ui/components/views/SavesView'
import { getGameData, listSaves } from './actions'

export default async function GamePage({
  searchParams
}: {
  searchParams: { managerId?: string, view?: string }
}) {
  const { managerId, view = 'home' } = searchParams

  if (!managerId) {
    redirect('/')
  }

  const gameData = await getGameData(managerId)
  const savesResult = view === 'saves' ? await listSaves(managerId) : null

  return (
    <GameLayout>
      {view === 'home' && (
        <HomeView
          nextFixture={gameData.nextFixture}
          standing={gameData.standing}
          injuredPlayers={gameData.injuredPlayers}
          suspendedPlayers={gameData.suspendedPlayers}
        />
      )}
      
      {view === 'squad' && (
        <SquadView players={gameData.players} />
      )}
      
      {view === 'table' && (
        <TableView 
          standings={gameData.standings} 
          divisionName={gameData.division.name}
        />
      )}
      
      {view === 'tactics' && (
        <div className="card-retro p-8 text-center">
          <h1 className="text-2xl mb-4">TÁTICAS</h1>
          <p>Em construção...</p>
        </div>
      )}
      
      {view === 'fixtures' && (
        <div className="card-retro p-8 text-center">
          <h1 className="text-2xl mb-4">JOGOS</h1>
          <p>Em construção...</p>
        </div>
      )}
      
      {view === 'transfers' && (
        <div className="card-retro p-8 text-center">
          <h1 className="text-2xl mb-4">TRANSFERÊNCIAS</h1>
          <p>Em construção...</p>
        </div>
      )}
      
      {view === 'training' && (
        <div className="card-retro p-8 text-center">
          <h1 className="text-2xl mb-4">TREINOS</h1>
          <p>Em construção...</p>
        </div>
      )}
      
      {view === 'finance' && (
        <div className="card-retro p-8 text-center">
          <h1 className="text-2xl mb-4">FINANÇAS</h1>
          <p>Em construção...</p>
        </div>
      )}
      
      {view === 'news' && (
        <div className="card-retro p-8 text-center">
          <h1 className="text-2xl mb-4">NOTÍCIAS</h1>
          <p>Em construção...</p>
        </div>
      )}
      
      {view === 'saves' && savesResult?.success && (
        <SavesView 
          saves={savesResult.saves} 
          managerId={managerId}
        />
      )}
    </GameLayout>
  )
}