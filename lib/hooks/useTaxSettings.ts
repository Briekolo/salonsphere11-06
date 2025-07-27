'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
  applies_to: string[];
  description?: string;
}

interface TaxSettings {
  company_vat_number: string;
  vat_liable: boolean;
  tax_rates: TaxRate[];
  default_tax_rate_id: string;
  reverse_charge_applicable: boolean;
  quarterly_reporting: boolean;
  tax_calculation_method: 'inclusive' | 'exclusive';
  invoice_tax_display: 'separate' | 'combined';
}

export function useTaxSettings() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: taxSettings, isLoading, error } = useQuery({
    queryKey: ['tax-settings', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('tax_settings, vat_number')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      const settings = data?.tax_settings || {};
      return {
        ...settings,
        company_vat_number: data?.vat_number || ''
      } as TaxSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidateTaxSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['tax-settings', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };

  // Helper function to get default tax rate
  const getDefaultTaxRate = (): TaxRate | null => {
    if (!taxSettings?.tax_rates) return null;
    
    return taxSettings.tax_rates.find(rate => 
      rate.id === taxSettings.default_tax_rate_id || rate.is_default
    ) || taxSettings.tax_rates[0] || null;
  };

  // Helper function to get tax rate for specific service type
  const getTaxRateForService = (serviceType: string): TaxRate | null => {
    if (!taxSettings?.tax_rates) return getDefaultTaxRate();
    
    const applicableRate = taxSettings.tax_rates.find(rate =>
      rate.applies_to.includes(serviceType)
    );
    
    return applicableRate || getDefaultTaxRate();
  };

  // Helper function to calculate tax amount
  const calculateTax = (amount: number, serviceType?: string): number => {
    const rate = serviceType ? getTaxRateForService(serviceType) : getDefaultTaxRate();
    if (!rate) return 0;

    if (taxSettings?.tax_calculation_method === 'inclusive') {
      // Tax is included in the amount
      return amount * (rate.rate / (100 + rate.rate));
    } else {
      // Tax is added to the amount
      return amount * (rate.rate / 100);
    }
  };

  // Helper function to get total with tax
  const getTotalWithTax = (amount: number, serviceType?: string): number => {
    if (taxSettings?.tax_calculation_method === 'inclusive') {
      return amount; // Tax already included
    } else {
      return amount + calculateTax(amount, serviceType);
    }
  };

  return {
    taxSettings,
    isLoading,
    error,
    invalidateTaxSettings,
    getDefaultTaxRate,
    getTaxRateForService,
    calculateTax,
    getTotalWithTax
  };
}