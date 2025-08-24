import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true }
    })

    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season found' }, { status: 404 })
    }

    // Get all divisions with their standings
    const divisions = await prisma.division.findMany({
      where: {
        seasonId: activeSeason.id
      },
      include: {
        standings: {
          where: {
            seasonId: activeSeason.id
          },
          include: {
            club: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        }
      },
      orderBy: {
        level: 'asc'
      }
    })

    // Format the response
    const formattedDivisions = divisions.map(division => ({
      id: division.id,
      name: division.name,
      level: division.level,
      standings: division.standings.map(standing => ({
        id: standing.id,
        position: standing.position,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        points: standing.points,
        club: standing.club
      }))
    }))

    return NextResponse.json({
      divisions: formattedDivisions,
      season: {
        year: activeSeason.year,
        isActive: activeSeason.isActive
      }
    })

  } catch (error) {
    console.error('Error fetching all divisions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
