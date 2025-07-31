import { NextRequest, NextResponse } from 'next/server'
import { SegmentService } from '@/lib/services/segmentService'

export async function GET(request: NextRequest) {
  try {
    const segments = await SegmentService.getSegments()
    return NextResponse.json(segments)
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const segment = await SegmentService.createSegment(data)
    return NextResponse.json(segment)
  } catch (error) {
    console.error('Error creating segment:', error)
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    )
  }
}