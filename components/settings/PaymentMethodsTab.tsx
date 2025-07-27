'use client';

import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { usePaymentSettings } from '@/lib/hooks/usePaymentSettings';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

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

interface PaymentMethods {
  methods: PaymentMethod[];
  default_method: string;
  require_payment_confirmation: boolean;
  allow_partial_payments: boolean;
  payment_terms_days: number;
  late_fee_percentage: number;
}

const defaultPaymentMethods: PaymentMethods = {
  methods: [
    {
      id: 'cash',
      name: 'Contant',
      type: 'cash',
      enabled: true,
      settings: {
        currency: 'EUR'
      }
    },
    {
      id: 'card',
      name: 'Pinbetaling',
      type: 'card',
      enabled: true,
      settings: {
        processing_fee: 2.5,
        currency: 'EUR'
      }
    },
    {
      id: 'ideal',
      name: 'iDEAL',
      type: 'digital_wallet',
      enabled: false,
      settings: {
        processing_fee: 0.35,
        currency: 'EUR'
      }
    }
  ],
  default_method: 'cash',
  require_payment_confirmation: true,
  allow_partial_payments: false,
  payment_terms_days: 14,
  late_fee_percentage: 5
};

const paymentTypeIcons = {
  card: CreditCard,
  cash: Banknote,
  bank_transfer: Building2,
  digital_wallet: Smartphone,
  other: CreditCard
};

const paymentTypeLabels = {
  card: 'Pinbetaling',
  cash: 'Contant',
  bank_transfer: 'Overboeking',
  digital_wallet: 'Digitale Wallet',
  other: 'Overig'
};

export function PaymentMethodsTab() {
  const { isAdmin } = useIsAdmin();
  const { tenantId } = useTenant();
  const { invalidatePaymentSettings } = usePaymentSettings();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>(defaultPaymentMethods);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (tenantId) {
      fetchPaymentMethods();
    }
  }, [tenantId]);

  const fetchPaymentMethods = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('payment_methods')
        .eq('id', tenantId)
        .single();

      if (!error && data?.payment_methods) {
        setPaymentMethods({
          ...defaultPaymentMethods,
          ...data.payment_methods
        });
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setMessage({ type: 'error', text: 'Kon betaalmethodes niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleMethodToggle = (methodId: string, enabled: boolean) => {
    setPaymentMethods(prev => ({
      ...prev,
      methods: prev.methods.map(method =>
        method.id === methodId ? { ...method, enabled } : method
      )
    }));
  };

  const handleMethodSettingChange = (methodId: string, setting: string, value: string | number) => {
    setPaymentMethods(prev => ({
      ...prev,
      methods: prev.methods.map(method =>
        method.id === methodId 
          ? { 
              ...method, 
              settings: { ...method.settings, [setting]: value }
            } 
          : method
      )
    }));
  };

  const handleGeneralSettingChange = (setting: keyof PaymentMethods, value: string | number | boolean) => {
    setPaymentMethods(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const addCustomPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: `custom_${Date.now()}`,
      name: 'Nieuwe betaalmethode',
      type: 'other',
      enabled: false,
      settings: {
        currency: 'EUR'
      }
    };

    setPaymentMethods(prev => ({
      ...prev,
      methods: [...prev.methods, newMethod]
    }));
  };

  const removePaymentMethod = (methodId: string) => {
    setPaymentMethods(prev => ({
      ...prev,
      methods: prev.methods.filter(method => method.id !== methodId),
      default_method: prev.default_method === methodId ? prev.methods[0]?.id || '' : prev.default_method
    }));
  };

  const toggleApiKeyVisibility = (methodId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [methodId]: !prev[methodId]
    }));
  };

  const handleSave = async () => {
    if (!tenantId || !isAdmin) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          payment_methods: paymentMethods,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      // Invalidate cached payment settings to trigger re-fetch across all components
      invalidatePaymentSettings();
      
      setMessage({ type: 'success', text: 'Betaalmethodes succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving payment methods:', error);
      setMessage({ type: 'error', text: 'Kon betaalmethodes niet opslaan' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Betaalmethodes</h2>
        <p className="text-gray-600 mt-1">
          Beheer beschikbare betaalmethodes en instellingen
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {message.text}
        </div>
      )}

      {!isAdmin && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Alleen-lezen:</strong> U heeft geen beheerrechten om deze gegevens te wijzigen.
          </p>
        </div>
      )}

      {/* Payment Methods */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h3 className="text-lg font-medium">Beschikbare Betaalmethodes</h3>
          </div>
          {isAdmin && (
            <button
              onClick={addCustomPaymentMethod}
              className="btn-secondary text-sm"
            >
              <Plus className="h-4 w-4" />
              Nieuwe Methode
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {paymentMethods.methods.map((method) => {
            const IconComponent = paymentTypeIcons[method.type];
            const isCustom = method.id.startsWith('custom_');
            
            return (
              <div key={method.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    {isCustom && isAdmin ? (
                      <input
                        type="text"
                        value={method.name}
                        onChange={(e) => handleMethodSettingChange(method.id, 'name', e.target.value)}
                        className="font-medium bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium">{method.name}</span>
                    )}
                    <span className="text-sm text-gray-500">
                      ({paymentTypeLabels[method.type]})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(e) => handleMethodToggle(method.id, e.target.checked)}
                        disabled={!isAdmin}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                    </label>
                    
                    {isCustom && isAdmin && (
                      <button
                        onClick={() => removePaymentMethod(method.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Verwijder methode"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {method.enabled && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verwerkingskosten (%)
                        </label>
                        <input
                          type="number"
                          value={method.settings.processing_fee || 0}
                          onChange={(e) => handleMethodSettingChange(method.id, 'processing_fee', parseFloat(e.target.value) || 0)}
                          disabled={!isAdmin}
                          step="0.1"
                          min="0"
                          max="10"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valuta
                        </label>
                        <select
                          value={method.settings.currency || 'EUR'}
                          onChange={(e) => handleMethodSettingChange(method.id, 'currency', e.target.value)}
                          disabled={!isAdmin}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>

                    {(method.type === 'card' || method.type === 'digital_wallet') && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Sleutel
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKeys[method.id] ? 'text' : 'password'}
                              value={method.settings.api_key || ''}
                              onChange={(e) => handleMethodSettingChange(method.id, 'api_key', e.target.value)}
                              disabled={!isAdmin}
                              placeholder="API sleutel van betalingsprovider"
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                            <button
                              type="button"
                              onClick={() => toggleApiKeyVisibility(method.id)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showApiKeys[method.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Merchant ID
                          </label>
                          <input
                            type="text"
                            value={method.settings.merchant_id || ''}
                            onChange={(e) => handleMethodSettingChange(method.id, 'merchant_id', e.target.value)}
                            disabled={!isAdmin}
                            placeholder="Merchant ID van betalingsprovider"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </div>
                    )}

                    {method.type === 'bank_transfer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bankrekeningnummer
                        </label>
                        <input
                          type="text"
                          value={method.settings.account_number || ''}
                          onChange={(e) => handleMethodSettingChange(method.id, 'account_number', e.target.value)}
                          disabled={!isAdmin}
                          placeholder="NL00 BANK 0123 4567 89"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* General Payment Settings */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Algemene Betalingsinstellingen</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standaard betaalmethode
            </label>
            <select
              value={paymentMethods.default_method}
              onChange={(e) => handleGeneralSettingChange('default_method', e.target.value)}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {paymentMethods.methods.filter(m => m.enabled).map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Betalingsbevestiging vereist</label>
              <p className="text-sm text-gray-500">Vraag om bevestiging bij betalingen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.require_payment_confirmation}
                onChange={(e) => handleGeneralSettingChange('require_payment_confirmation', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Gedeeltelijke betalingen toestaan</label>
              <p className="text-sm text-gray-500">Sta deelbetalingen toe voor facturen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.allow_partial_payments}
                onChange={(e) => handleGeneralSettingChange('allow_partial_payments', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Betalingstermijn (dagen)
              </label>
              <input
                type="number"
                value={paymentMethods.payment_terms_days}
                onChange={(e) => handleGeneralSettingChange('payment_terms_days', parseInt(e.target.value) || 14)}
                disabled={!isAdmin}
                min="1"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Aantal dagen om factuur te betalen</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vertragingsrente (%)
              </label>
              <input
                type="number"
                value={paymentMethods.late_fee_percentage}
                onChange={(e) => handleGeneralSettingChange('late_fee_percentage', parseFloat(e.target.value) || 0)}
                disabled={!isAdmin}
                step="0.5"
                min="0"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage bij te late betaling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Betalingsprovider Configuratie</p>
            <p>Voor online betalingen (iDEAL, creditcard) moet u eerst een account aanmaken bij een betalingsprovider zoals Stripe, Mollie of Adyen. Voer vervolgens de API-gegevens in.</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Wijzigingen Opslaan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}