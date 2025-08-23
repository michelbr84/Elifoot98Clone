import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SeasonManager } from '@/src/game/rules/season-manager'

export async function GET() {
  try {
    const seasonManager = new SeasonManager(prisma)
    const status = await seasonManager.getSeasonStatus()
    
    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error getting season status:', error)
    return NextResponse.json({ error: 'Failed to get season status' }, { status: 500 })
  }
}