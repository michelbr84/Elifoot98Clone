import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = parseInt(searchParams.get('level') || '1')

    const season = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        divisions: {
          where: { level },
          include: {
            clubs: true
          }
        }
      }
    })

    if (!season || season.divisions.length === 0) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 })
    }

    const division = season.divisions[0]

    // Get standings for this division
    const standings = await prisma.standing.findMany({
      where: {
        seasonId: season.id,
        club: {
          divisionId: division.id
        }
      },
      include: {
        club: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { points: 'desc' },
        { goalsFor: 'desc' },
        { goalsAgainst: 'asc' }
      ]
    })

    // Add position to standings
    const standingsWithPosition = standings.map((standing, index) => ({
      ...standing,
      position: index + 1
    }))

    return NextResponse.json({ standings: standingsWithPosition })
  } catch (error) {
    console.error('Error loading division standings:', error)
    return NextResponse.json({ error: 'Failed to load standings' }, { status: 500 })
  }
}