// pages/api/trips.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
const trips = await prisma.trip.findMany({
      where: {
        userId: 1, // 实际应用中应该从session或token中获取
      },
      orderBy: {
        createdAt: 'desc', // 按打车时间倒序排列
      },
    })
    return NextResponse.json(trips)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET'
    }
  })
}