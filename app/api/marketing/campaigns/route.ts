import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/services/campaignService'

export async function GET(request: NextRequest) {
  try {
    const campaigns = await CampaignService.getCampaigns()
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const campaign = await CampaignService.createCampaign(data)
    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}