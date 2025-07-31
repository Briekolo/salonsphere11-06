import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, excludeTenantId } = body;

    if (!subdomain) {
      return NextResponse.json(
        { available: false, error: 'Subdomain is verplicht' },
        { status: 400 }
      );
    }

    // Basic validation
    if (subdomain.length < 3 || subdomain.length > 63) {
      return NextResponse.json({
        available: false,
        error: 'Subdomain moet tussen 3 en 63 karakters bevatten'
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9\-]{1,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json({
        available: false,
        error: 'Subdomain mag alleen kleine letters, cijfers en streepjes bevatten'
      });
    }

    // Check for consecutive hyphens
    if (subdomain.includes('--')) {
      return NextResponse.json({
        available: false,
        error: 'Subdomain mag geen opeenvolgende streepjes bevatten'
      });
    }

    // Reserved subdomains
    const reservedSubdomains = [
      'www', 'mail', 'ftp', 'admin', 'api', 'app', 'blog', 'shop', 'store',
      'support', 'help', 'contact', 'about', 'news', 'legal', 'privacy',
      'terms', 'security', 'status', 'test', 'dev', 'staging', 'cdn',
      'assets', 'static', 'media', 'images', 'docs', 'documentation'
    ];

    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return NextResponse.json({
        available: false,
        error: 'Deze subdomain is gereserveerd en niet beschikbaar'
      });
    }

    // Initialize Supabase
    const supabase = createRouteHandlerClient({ cookies });

    // Check if subdomain already exists (excluding current tenant)
    let query = supabase
      .from('tenants')
      .select('id, subdomain')
      .eq('subdomain', subdomain.toLowerCase());

    if (excludeTenantId) {
      query = query.neq('id', excludeTenantId);
    }

    const { data: existing, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error checking subdomain:', error);
      return NextResponse.json({
        available: false,
        error: 'Kon subdomain beschikbaarheid niet controleren'
      }, { status: 500 });
    }

    const available = !existing;

    return NextResponse.json({
      available,
      error: available ? undefined : 'Deze subdomain is al in gebruik'
    });

  } catch (error) {
    console.error('Error in availability check:', error);
    return NextResponse.json(
      {
        available: false,
        error: 'Er ging iets mis bij het controleren van de subdomain'
      },
      { status: 500 }
    );
  }
}