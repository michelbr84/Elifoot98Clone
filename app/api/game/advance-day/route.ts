import { NextRequest, NextResponse } from 'next/server'
import { advanceDay } from '@/app/game/actions'

export async function POST(request: NextRequest) {
  try {
    const { managerId, currentDate } = await request.json()

    if (!managerId || !currentDate) {
      return NextResponse.json({ error: 'Manager ID and current date are required' }, { status: 400 })
    }

    const result = await advanceDay(managerId, new Date(currentDate))
    
    return NextResponse.json({ 
      success: true, 
      newDate: result.newDate.toISOString(),
      seasonEnded: result.seasonEnded 
    })
  } catch (error) {
    console.error('Error advancing day:', error)
    console.error('Error stack:', (error as Error).stack)
    return NextResponse.json({ 
      error: 'Failed to advance day',
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 })
  }
}
