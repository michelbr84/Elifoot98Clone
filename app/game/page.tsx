import { redirect } from 'next/navigation'
import { GameLayout } from '@/src/ui/components/GameLayout'
import { HomeView } from '@/src/ui/components/views/HomeView'
import { SquadView } from '@/src/ui/components/views/SquadView'
import { TableView } from '@/src/ui/components/views/TableView'
import { TacticsView } from '@/src/ui/components/views/TacticsView'
import { FixturesView } from '@/src/ui/components/views/FixturesView'
import { FinanceView } from '@/src/ui/components/views/FinanceView'
import { NewsView } from '@/src/ui/components/views/NewsView'
import { SavesView } from '@/src/ui/components/views/SavesView'
import { getGameData, listSaves, getFinanceData, getNews } from './actions'

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
  const financeData = view === 'finance' ? await getFinanceData(managerId) : null
  const news = view === 'news' ? await getNews(managerId) : null

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
      
      {view === 'tactics' && <TacticsView />}
      
      {view === 'fixtures' && (
        <FixturesView 
          fixtures={gameData.fixtures}
          currentRound={gameData.currentRound}
          clubId={gameData.club.id}
        />
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
      
      {view === 'finance' && financeData && (
        <FinanceView financeData={financeData} />
      )}
      
      {view === 'news' && news && (
        <NewsView 
          news={news}
          clubId={gameData.club.id}
        />
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