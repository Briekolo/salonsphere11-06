'use client';

import { useBusinessInfo } from './useBusinessInfo';

export function useBusinessLogo() {
  const { businessInfo, isLoading, error } = useBusinessInfo();

  return {
    logoUrl: businessInfo?.logo_url || null,
    salonName: businessInfo?.name || 'Salon',
    isLoading,
    error,
    hasLogo: !!businessInfo?.logo_url
  };
}