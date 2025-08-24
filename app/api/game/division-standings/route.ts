import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')

  if (!level) {
    return NextResponse.json({ error: 'Division level is required' }, { status: 400 })
  }

  try {
    // First, find the active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true }
    })

    if (!activeSeason) {
      return NextResponse.json({ 
        success: true,
        standings: [] 
      })
    }

    const division = await prisma.division.findFirst({
      where: { 
        level: parseInt(level),
        seasonId: activeSeason.id
      }
    })

    if (!division) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 })
    }

    const standings = await prisma.standing.findMany({
      where: {
        seasonId: activeSeason.id,
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

    // Update positions based on sorting
    const sortedStandings = standings.map((standing, index) => ({
      ...standing,
      position: index + 1
    }))

    return NextResponse.json({ 
      success: true,
      standings: sortedStandings 
    })
  } catch (error) {
    console.error('Error fetching division standings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch division standings' 
    }, { status: 500 })
  }
}
