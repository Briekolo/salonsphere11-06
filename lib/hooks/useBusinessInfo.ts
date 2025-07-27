'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

interface BusinessInfo {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  vat_number: string;
  chamber_of_commerce: string;
  logo_url?: string;
}

export function useBusinessInfo() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: businessInfo, isLoading, error } = useQuery({
    queryKey: ['business-info', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          name,
          description,
          email,
          phone,
          website,
          address,
          city,
          postal_code,
          country,
          vat_number,
          chamber_of_commerce,
          logo_url
        `)
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data as BusinessInfo;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidateBusinessInfo = () => {
    queryClient.invalidateQueries({ queryKey: ['business-info', tenantId] });
    // Also invalidate tenant queries that might cache this data
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
    queryClient.invalidateQueries({ queryKey: ['user-tenant'] });
  };

  return {
    businessInfo,
    isLoading,
    error,
    invalidateBusinessInfo
  };
}