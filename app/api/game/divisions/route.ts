import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET() {
  try {
    const divisions = await prisma.division.findMany({
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
