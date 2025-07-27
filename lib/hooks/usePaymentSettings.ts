'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'cash' | 'bank_transfer' | 'digital_wallet' | 'other';
  enabled: boolean;
  settings: {
    api_key?: string;
    merchant_id?: string;
    account_number?: string;
    processing_fee?: number;
    currency?: string;
  };
}

interface PaymentSettings {
  methods: PaymentMethod[];
  default_method: string;
  require_payment_confirmation: boolean;
  allow_partial_payments: boolean;
  payment_terms_days: number;
  late_fee_percentage: number;
}

export function usePaymentSettings() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: paymentSettings, isLoading, error } = useQuery({
    queryKey: ['payment-settings', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('payment_methods')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data?.payment_methods as PaymentSettings | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidatePaymentSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-settings', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };

  // Helper function to get enabled payment methods
  const getEnabledPaymentMethods = (): PaymentMethod[] => {
    if (!paymentSettings?.methods) return [];
    return paymentSettings.methods.filter(method => method.enabled);
  };

  // Helper function to get default payment method
  const getDefaultPaymentMethod = (): PaymentMethod | null => {
    if (!paymentSettings?.methods) return null;
    
    const defaultMethod = paymentSettings.methods.find(
      method => method.id === paymentSettings.default_method && method.enabled
    );
    
    return defaultMethod || getEnabledPaymentMethods()[0] || null;
  };

  // Helper function to calculate processing fee
  const calculateProcessingFee = (amount: number, methodId?: string): number => {
    if (!paymentSettings?.methods) return 0;

    const method = methodId 
      ? paymentSettings.methods.find(m => m.id === methodId)
      : getDefaultPaymentMethod();

    if (!method?.settings?.processing_fee) return 0;
    
    return amount * (method.settings.processing_fee / 100);
  };

  // Helper function to get total with processing fee
  const getTotalWithProcessingFee = (amount: number, methodId?: string): number => {
    return amount + calculateProcessingFee(amount, methodId);
  };

  // Helper function to calculate due date
  const calculateDueDate = (invoiceDate: Date = new Date()): Date => {
    const daysToAdd = paymentSettings?.payment_terms_days || 14;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate;
  };

  // Helper function to calculate late fee
  const calculateLateFee = (amount: number, dueDate: Date, currentDate: Date = new Date()): number => {
    if (currentDate <= dueDate || !paymentSettings?.late_fee_percentage) return 0;
    
    return amount * (paymentSettings.late_fee_percentage / 100);
  };

  // Helper function to check if payment confirmation is required
  const isPaymentConfirmationRequired = (): boolean => {
    return paymentSettings?.require_payment_confirmation || false;
  };

  // Helper function to check if partial payments are allowed
  const arePartialPaymentsAllowed = (): boolean => {
    return paymentSettings?.allow_partial_payments || false;
  };

  return {
    paymentSettings,
    isLoading,
    error,
    invalidatePaymentSettings,
    getEnabledPaymentMethods,
    getDefaultPaymentMethod,
    calculateProcessingFee,
    getTotalWithProcessingFee,
    calculateDueDate,
    calculateLateFee,
    isPaymentConfirmationRequired,
    arePartialPaymentsAllowed
  };
}