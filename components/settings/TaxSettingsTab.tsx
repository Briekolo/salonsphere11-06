'use client';

import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useTaxSettings } from '@/lib/hooks/useTaxSettings';
import { supabase } from '@/lib/supabase';
import { 
  Calculator,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Info
} from 'lucide-react';

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

const defaultTaxSettings: TaxSettings = {
  company_vat_number: '',
  vat_liable: true,
  tax_rates: [
    {
      id: 'standard',
      name: 'Standaard BTW',
      rate: 21,
      is_default: true,
      applies_to: ['services', 'products'],
      description: 'Standaard Nederlandse BTW-tarief'
    },
    {
      id: 'reduced',
      name: 'Verlaagd BTW',
      rate: 9,
      is_default: false,
      applies_to: ['food', 'books'],
      description: 'Verlaagd BTW-tarief voor specifieke goederen'
    },
    {
      id: 'zero',
      name: 'Nul BTW',
      rate: 0,
      is_default: false,
      applies_to: ['exports', 'medical'],
      description: 'Geen BTW voor bepaalde diensten'
    }
  ],
  default_tax_rate_id: 'standard',
  reverse_charge_applicable: false,
  quarterly_reporting: true,
  tax_calculation_method: 'exclusive',
  invoice_tax_display: 'separate'
};

const serviceTypes = [
  { value: 'services', label: 'Dienstverlening' },
  { value: 'products', label: 'Producten' },
  { value: 'food', label: 'Voeding' },
  { value: 'books', label: 'Boeken' },
  { value: 'exports', label: 'Export' },
  { value: 'medical', label: 'Medische diensten' },
  { value: 'education', label: 'Onderwijs' },
  { value: 'transport', label: 'Transport' }
];

export function TaxSettingsTab() {
  const { isAdmin } = useIsAdmin();
  const { tenantId } = useTenant();
  const { invalidateTaxSettings } = useTaxSettings();
  
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchTaxSettings();
    }
  }, [tenantId]);

  const fetchTaxSettings = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('tax_settings, vat_number')
        .eq('id', tenantId)
        .single();

      if (!error && data) {
        const mergedSettings = {
          ...defaultTaxSettings,
          company_vat_number: data.vat_number || '',
          ...(data.tax_settings || {})
        };
        setTaxSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      setMessage({ type: 'error', text: 'Kon BTW-instellingen niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSettingChange = (setting: keyof TaxSettings, value: string | boolean) => {
    setTaxSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleTaxRateChange = (rateId: string, field: keyof TaxRate, value: any) => {
    setTaxSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map(rate =>
        rate.id === rateId ? { ...rate, [field]: value } : rate
      )
    }));
  };

  const addCustomTaxRate = () => {
    const newRate: TaxRate = {
      id: `custom_${Date.now()}`,
      name: 'Nieuw BTW-tarief',
      rate: 21,
      is_default: false,
      applies_to: ['services'],
      description: ''
    };

    setTaxSettings(prev => ({
      ...prev,
      tax_rates: [...prev.tax_rates, newRate]
    }));
  };

  const removeTaxRate = (rateId: string) => {
    setTaxSettings(prev => {
      const updatedRates = prev.tax_rates.filter(rate => rate.id !== rateId);
      const newDefaultId = prev.default_tax_rate_id === rateId 
        ? updatedRates[0]?.id || '' 
        : prev.default_tax_rate_id;
      
      return {
        ...prev,
        tax_rates: updatedRates,
        default_tax_rate_id: newDefaultId
      };
    });
  };

  const setAsDefault = (rateId: string) => {
    setTaxSettings(prev => ({
      ...prev,
      default_tax_rate_id: rateId,
      tax_rates: prev.tax_rates.map(rate => ({
        ...rate,
        is_default: rate.id === rateId
      }))
    }));
  };

  const handleAppliesTo = (rateId: string, serviceType: string, checked: boolean) => {
    setTaxSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map(rate =>
        rate.id === rateId
          ? {
              ...rate,
              applies_to: checked
                ? [...rate.applies_to, serviceType]
                : rate.applies_to.filter(type => type !== serviceType)
            }
          : rate
      )
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
          tax_settings: {
            ...taxSettings,
            company_vat_number: undefined // Don't store in tax_settings
          },
          vat_number: taxSettings.company_vat_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      // Invalidate cached tax settings to trigger re-fetch across all components
      invalidateTaxSettings();
      
      setMessage({ type: 'success', text: 'BTW-instellingen succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving tax settings:', error);
      setMessage({ type: 'error', text: 'Kon BTW-instellingen niet opslaan' });
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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">BTW Instellingen</h2>
          <p className="text-gray-600 mt-1">
            Beheer BTW-tarieven en belastinginstellingen
          </p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 text-sm">
              <strong>Geen toegang:</strong> U heeft geen beheerrechten om BTW-instellingen te bekijken of wijzigen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">BTW Instellingen</h2>
        <p className="text-gray-600 mt-1">
          Beheer BTW-tarieven en belastinginstellingen
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

      {/* Company VAT Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-medium">Bedrijfsgegevens BTW</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BTW-nummer
            </label>
            <input
              type="text"
              value={taxSettings.company_vat_number}
              onChange={(e) => handleGeneralSettingChange('company_vat_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NL123456789B01"
            />
            <p className="text-xs text-gray-500 mt-1">Officieel BTW-nummer zoals geregistreerd bij de Belastingdienst</p>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">BTW-plichtig</label>
              <p className="text-sm text-gray-500">Bedrijf is BTW-plichtig</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={taxSettings.vat_liable}
                onChange={(e) => handleGeneralSettingChange('vat_liable', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tax Rates */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">BTW-tarieven</h3>
          <button
            onClick={addCustomTaxRate}
            className="btn-secondary text-sm"
          >
            <Plus className="h-4 w-4" />
            Nieuw Tarief
          </button>
        </div>
        
        <div className="space-y-4">
          {taxSettings.tax_rates.map((rate) => {
            const isCustom = rate.id.startsWith('custom_');
            
            return (
              <div key={rate.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isCustom ? (
                      <input
                        type="text"
                        value={rate.name}
                        onChange={(e) => handleTaxRateChange(rate.id, 'name', e.target.value)}
                        className="font-medium bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium">{rate.name}</span>
                    )}
                    {rate.is_default && (
                      <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                        Standaard
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!rate.is_default && (
                      <button
                        onClick={() => setAsDefault(rate.id)}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        Stel in als standaard
                      </button>
                    )}
                    {isCustom && (
                      <button
                        onClick={() => removeTaxRate(rate.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Verwijder tarief"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BTW-percentage (%)
                    </label>
                    <input
                      type="number"
                      value={rate.rate}
                      onChange={(e) => handleTaxRateChange(rate.id, 'rate', parseFloat(e.target.value) || 0)}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving
                    </label>
                    <input
                      type="text"
                      value={rate.description || ''}
                      onChange={(e) => handleTaxRateChange(rate.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Optionele beschrijving"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Van toepassing op
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {serviceTypes.map((serviceType) => (
                      <label key={serviceType.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={rate.applies_to.includes(serviceType.value)}
                          onChange={(e) => handleAppliesTo(rate.id, serviceType.value, e.target.checked)}
                        />
                        {serviceType.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax Calculation Settings */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Berekeningsinstellingen</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standaard BTW-tarief
            </label>
            <select
              value={taxSettings.default_tax_rate_id}
              onChange={(e) => handleGeneralSettingChange('default_tax_rate_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {taxSettings.tax_rates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name} ({rate.rate}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BTW-berekening
              </label>
              <select
                value={taxSettings.tax_calculation_method}
                onChange={(e) => handleGeneralSettingChange('tax_calculation_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="exclusive">Exclusief BTW</option>
                <option value="inclusive">Inclusief BTW</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {taxSettings.tax_calculation_method === 'exclusive' 
                  ? 'BTW wordt toegevoegd aan het basisbedrag'
                  : 'BTW is inbegrepen in het totaalbedrag'
                }
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BTW-weergave op factuur
              </label>
              <select
                value={taxSettings.invoice_tax_display}
                onChange={(e) => handleGeneralSettingChange('invoice_tax_display', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="separate">Apart weergeven</option>
                <option value="combined">Gecombineerd weergeven</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Omgekeerde heffing van toepassing</label>
              <p className="text-sm text-gray-500">Voor zakelijke klanten binnen de EU</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={taxSettings.reverse_charge_applicable}
                onChange={(e) => handleGeneralSettingChange('reverse_charge_applicable', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Kwartaalrapportage</label>
              <p className="text-sm text-gray-500">BTW-aangifte per kwartaal</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={taxSettings.quarterly_reporting}
                onChange={(e) => handleGeneralSettingChange('quarterly_reporting', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Belangrijke BTW-informatie</p>
            <p>Deze instellingen zijn bedoeld voor standaard BTW-beheer. Voor complexere belastingzaken raden wij aan om een belastingadviseur te raadplegen. Controleer altijd of de instellingen voldoen aan de huidige Nederlandse belastingwetgeving.</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
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
    </div>
  );
}