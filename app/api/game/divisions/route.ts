import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET() {
  try {
    // First, find the active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true }
    })

    if (!activeSeason) {
      return NextResponse.json({ 
        success: true,
        divisions: [] 
      })
    }

    // Fetch only divisions from the active season
    const divisions = await prisma.division.findMany({
      where: {
        seasonId: activeSeason.id
      },
      orderBy: {
        level: 'asc'
      }
    })
    
    return NextResponse.json({ 
      success: true,
      divisions 
    })
  } catch (error) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch divisions' 
    }, { status: 500 })
  }
}
