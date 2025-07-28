import { supabase } from '@/lib/supabase';

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  theme_settings: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    logo_position: string;
  };
  booking_settings: {
    advance_booking_days: number;
    min_advance_hours: number;
    max_services_per_booking: number;
    require_deposit: boolean;
    deposit_percentage: number;
    cancellation_hours: number;
    allow_guest_booking: boolean;
  };
  logo_url?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * Resolves tenant information from domain/subdomain
 * 
 * Resolution order:
 * 1. Custom domain (e.g., www.beautysalon.nl)
 * 2. Subdomain (e.g., beautysalon.salonsphere.nl)
 * 3. Path-based (e.g., salonsphere.nl/salon/beautysalon)
 */
export async function resolveTenant(domain: string): Promise<TenantInfo | null> {
  try {
    // For development, extract subdomain from the path
    // In production, this would check actual domain/subdomain
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      // In development: /salon-name/services -> extract "salon-name"
      const subdomain = domain;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .single();
        
      if (error) {
        console.error('Tenant not found:', subdomain, error);
        // Check if we have a mock tenant for development
        const mockTenant = getMockTenant(subdomain);
        // For testing, use the real tenant ID from database
        if (subdomain === 'brieks-salon') {
          mockTenant.id = '7aa448b8-3166-4693-a13d-e833748292db';
        }
        return mockTenant;
      }
      
      return data as TenantInfo;
    } else {
      // In production: check actual domain
      try {
        // First check custom domain
        const { data: customDomainTenant, error: customDomainError } = await supabase
          .from('tenants')
          .select('*')
          .eq('custom_domain', domain)
          .eq('domain_verified', true)
          .single();
          
        if (customDomainTenant) {
          return customDomainTenant as TenantInfo;
        }
        
        console.log('Custom domain not found, checking subdomain...', customDomainError);
      } catch (error) {
        console.log('Custom domain query failed, trying subdomain...', error);
      }
      
      try {
        // Then check subdomain
        const subdomain = domain.split('.')[0];
        const { data: subdomainTenant, error: subdomainError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .single();
          
        if (subdomainTenant) {
          return subdomainTenant as TenantInfo;
        }
        
        console.log('Subdomain not found:', subdomainError);
      } catch (error) {
        console.log('Subdomain query failed:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving tenant:', error);
    return getMockTenant(domain);
  }
}

// Mock tenant for development
function getMockTenant(subdomain: string): TenantInfo {
  const mockTenants: Record<string, Partial<TenantInfo>> = {
    'beauty-salon': {
      name: 'Beauty Salon Excellence',
      theme_settings: {
        primary_color: '#E91E63',
        secondary_color: '#FFC107',
        font_family: 'Inter',
        logo_position: 'left'
      }
    },
    'hair-studio': {
      name: 'Hair Studio Pro',
      theme_settings: {
        primary_color: '#9C27B0',
        secondary_color: '#00BCD4',
        font_family: 'Inter',
        logo_position: 'center'
      }
    },
    'nail-bar': {
      name: 'Luxury Nail Bar',
      theme_settings: {
        primary_color: '#FF5722',
        secondary_color: '#795548',
        font_family: 'Inter',
        logo_position: 'left'
      }
    }
  };
  
  const tenantData = mockTenants[subdomain] || {};
  
  return {
    id: `mock-${subdomain}`,
    name: tenantData.name || subdomain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    subdomain: subdomain,
    theme_settings: tenantData.theme_settings || {
      primary_color: '#02011F',
      secondary_color: '#FE7E6D',
      font_family: 'Inter',
      logo_position: 'left'
    },
    booking_settings: {
      advance_booking_days: 90,
      min_advance_hours: 24,
      max_services_per_booking: 3,
      require_deposit: false,
      deposit_percentage: 20,
      cancellation_hours: 24,
      allow_guest_booking: true
    },
    address: 'Hoofdstraat 123',
    city: 'Amsterdam',
    postal_code: '1234 AB',
    phone: '+31 6 12345678',
    email: `info@${subdomain}.nl`
  };
}