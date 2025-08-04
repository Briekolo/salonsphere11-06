import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendarService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }

    // Generate Google OAuth URL
    const authUrl = googleCalendarService.getAuthUrl(tenantId);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}