import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Google Calendar integration temporarily disabled during payment system implementation
  return NextResponse.json(
    { error: 'Google Calendar integration is temporarily unavailable' },
    { status: 503 }
  );
}

export async function DELETE(request: NextRequest) {
  // Google Calendar integration temporarily disabled during payment system implementation
  return NextResponse.json(
    { error: 'Google Calendar integration is temporarily unavailable' },
    { status: 503 }
  );
}