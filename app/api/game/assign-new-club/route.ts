import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { managerId, clubId } = await request.json()

    if (!managerId || !clubId) {
      return NextResponse.json(
        { error: 'Manager ID and Club ID are required' },
        { status: 400 }
      )
    }

    // Verify the manager exists and is human
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { club: true }
    })

    if (!manager || !manager.isHuman) {
      return NextResponse.json(
        { error: 'Manager not found or not human' },
        { status: 404 }
      )
    }

    // Verify the club exists and is in Serie D
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        division: {
          include: {
            season: true
          }
        }
      }
    })

    if (!club || club.division.level !== 4 || !club.division.season.isActive) {
      return NextResponse.json(
        { error: 'Club not found or not in active Serie D' },
        { status: 404 }
      )
    }

    // Check if the club already has a human manager
    const existingManager = await prisma.manager.findFirst({
      where: {
        clubId: clubId,
        isHuman: true
      }
    })

    if (existingManager) {
      return NextResponse.json(
        { error: 'Club already has a human manager' },
        { status: 409 }
      )
    }

    // Assign the new club to the manager
    await prisma.manager.update({
      where: { id: managerId },
      data: { clubId: clubId }
    })

    // Create news about the new assignment
    await prisma.news.create({
      data: {
        type: 'general',
        title: '🔄 Novo Clube',
        content: `${manager.name} foi contratado pelo ${club.name} da Série D.`,
        clubId: clubId,
        date: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Manager assigned to new club successfully'
    })

  } catch (error) {
    console.error('Error assigning new club to manager:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
