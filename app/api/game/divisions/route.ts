import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET() {
  try {
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        divisions: {
          select: {
            id: true,
            name: true,
            level: true
          },
          orderBy: {
            level: 'asc'
          }
        }
      }
    })

    if (!season) {
      return NextResponse.json({ error: 'No active season found' }, { status: 404 })
    }

    return NextResponse.json({ divisions: season.divisions })
  } catch (error) {
    console.error('Error loading divisions:', error)
    return NextResponse.json({ error: 'Failed to load divisions' }, { status: 500 })
  }
}
