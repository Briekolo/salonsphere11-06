import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/services/campaignService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await CampaignService.sendCampaign(params.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send campaign' },
      { status: 500 }
    )
  }
}