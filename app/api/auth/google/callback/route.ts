import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Google Calendar integration temporarily disabled during payment system implementation
  return NextResponse.redirect(
    new URL('/admin/integrations?error=google_calendar_temporarily_disabled', request.url)
  );
}