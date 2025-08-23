import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { startNewGame } from '../game/actions'

const prisma = new PrismaClient()

async function getClubs() {
  const divisions = await prisma.division.findMany({
    include: {
      clubs: {
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: {
      level: 'asc'
    }
  })
  return divisions
}

export default async function NewGamePage({
  searchParams
}: {
  searchParams: { quickstart?: string }
}) {
  const divisions = await getClubs()

  async function handleNewGame(formData: FormData) {
    'use server'
    
    const managerName = formData.get('managerName') as string
    const clubId = formData.get('clubId') as string
    
    if (!managerName || !clubId) {
      return
    }
    
    const manager = await startNewGame(managerName, clubId)
    redirect(`/game?managerId=${manager.id}`)
  }

  // Quick start handler
  if (searchParams.quickstart) {
    const manager = await startNewGame('Treinador', searchParams.quickstart)
    redirect(`/game?managerId=${manager.id}`)
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card-retro mb-4">
          <h1 className="text-3xl font-mono mb-4">NOVO JOGO</h1>
          
          <form action={handleNewGame}>
            <div className="space-y-4">
              <div>
                <label className="block font-mono mb-2">NOME DO TREINADOR:</label>
                <input
                  type="text"
                  name="managerName"
                  required
                  className="input-retro w-full max-w-md"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block font-mono mb-2">ESCOLHA SEU CLUBE:</label>
                
                {divisions.map((division) => (
                  <div key={division.id} className="mb-6">
                    <h3 className="font-mono font-bold mb-2 text-lg">
                      {division.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {division.clubs.map((club) => (
                        <label 
                          key={club.id}
                          className="flex items-center gap-2 p-2 border border-black cursor-pointer hover:bg-retro-gray"
                        >
                          <input
                            type="radio"
                            name="clubId"
                            value={club.id}
                            required
                            className="cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="font-bold">{club.name}</div>
                            <div className="text-xs">
                              Orçamento: §{club.budget.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  INICIAR JOGO
                </button>
                <a href="/" className="btn-retro">
                  CANCELAR
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}