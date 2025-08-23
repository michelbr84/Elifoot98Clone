import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

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

export default async function Home() {
  const divisions = await getClubs()
  
  // For demo purposes, pick first club of Serie A
  const defaultClub = divisions[0]?.clubs[0]
  
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card-retro max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 font-mono">FOOTMANAGER 98</h1>
        <p className="mb-8">Um jogo de gerenciamento de futebol inspirado nos clássicos</p>
        <div className="flex gap-4 justify-center mb-8">
          <Link 
            href={`/new-game`}
            className="btn-primary"
          >
            NOVO JOGO
          </Link>
          <button className="btn-retro" disabled>CARREGAR</button>
        </div>
        
        {/* Quick Start for Demo */}
        {defaultClub && (
          <div className="mt-8 pt-8 border-t-2 border-black">
            <p className="text-sm mb-4">Início Rápido (Demo):</p>
            <Link
              href={`/new-game?quickstart=${defaultClub.id}`}
              className="btn-success"
            >
              JOGAR COM {defaultClub.name.toUpperCase()}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}