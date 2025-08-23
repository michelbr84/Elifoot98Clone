import { NextRequest, NextResponse } from 'next/server'
import { getGameData } from '@/app/game/actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const managerId = searchParams.get('managerId')

  if (!managerId) {
    return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 })
  }

  try {
    const gameData = await getGameData(managerId)
    
    return NextResponse.json({
      manager: {
        id: gameData.manager.id,
        name: gameData.manager.name,
        isHuman: gameData.manager.isHuman,
        clubId: gameData.manager.clubId,
        createdAt: gameData.manager.createdAt,
        updatedAt: gameData.manager.updatedAt
      },
      club: {
        id: gameData.club.id,
        name: gameData.club.name,
        shortName: gameData.club.shortName,
        colors: gameData.club.colors,
        founded: gameData.club.founded,
        stadium: gameData.club.stadium,
        capacity: gameData.club.capacity,
        budget: gameData.club.budget,
        divisionId: gameData.club.divisionId,
        createdAt: gameData.club.createdAt,
        updatedAt: gameData.club.updatedAt
      },
      season: gameData.season ? {
        id: gameData.season.id,
        year: gameData.season.year,
        startDate: gameData.season.startDate,
        endDate: gameData.season.endDate,
        isActive: gameData.season.isActive,
        createdAt: gameData.season.createdAt,
        updatedAt: gameData.season.updatedAt
      } : null,
      currentDate: gameData.season?.startDate || new Date()
    })
  } catch (error) {
    console.error('Error initializing game state:', error)
    return NextResponse.json({ error: 'Failed to initialize game state' }, { status: 500 })
  }
}
