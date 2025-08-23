import { NextRequest, NextResponse } from 'next/server'
import { playNextMatch } from '@/app/game/actions'

export async function POST(request: NextRequest) {
  try {
    const { managerId } = await request.json()

    if (!managerId) {
      return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 })
    }

    const result = await playNextMatch(managerId)
    
    return NextResponse.json({ 
      success: true, 
      result: {
        homeClub: result.result.homeClub,
        awayClub: result.result.awayClub,
        homeScore: result.result.homeScore,
        awayScore: result.result.awayScore,
        events: result.result.events,
        commentary: result.result.commentary
      }
    })
  } catch (error) {
    console.error('Error playing match:', error)
    return NextResponse.json({ 
      error: 'Failed to play match',
      details: (error as Error).message 
    }, { status: 500 })
  }
}
