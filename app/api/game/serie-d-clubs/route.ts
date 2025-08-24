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

    // Get Serie D clubs that don't have a human manager
    const serieDClubs = await prisma.club.findMany({
      where: {
        division: {
          level: 4,
          seasonId: activeSeason.id
        },
        managedBy: {
          none: {
            isHuman: true
          }
        }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      clubs: serieDClubs
    })

  } catch (error) {
    console.error('Error fetching Serie D clubs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
