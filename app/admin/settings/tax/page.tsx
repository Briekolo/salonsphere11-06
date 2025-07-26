'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  Calculator,
  Save,
  Loader2,
  Info,
  Percent
} from 'lucide-react';

interface TaxSettings {
  default_vat_rate: number;
  reduced_vat_rate: number;
  vat_number: string;
  include_vat_in_prices: boolean;
  enable_vat_reporting: boolean;
}

export default function TaxSettingsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  
  const [settings, setSettings] = useState<TaxSettings>({
    default_vat_rate: 21,
    reduced_vat_rate: 9,
    vat_number: '',
    include_vat_in_prices: true,
    enable_vat_reporting: true
  });
  
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
        .select('vat_number, tax_settings')
        .eq('id', tenantId)
        .single();

      if (!error && data) {
        setSettings({
          default_vat_rate: data.tax_settings?.default_vat_rate || 21,
          reduced_vat_rate: data.tax_settings?.reduced_vat_rate || 9,
          vat_number: data.vat_number || '',
          include_vat_in_prices: data.tax_settings?.include_vat_in_prices ?? true,
          enable_vat_reporting: data.tax_settings?.enable_vat_reporting ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      setMessage({ type: 'error', text: 'Kon BTW instellingen niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaxSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!tenantId) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          vat_number: settings.vat_number,
          tax_settings: {
            default_vat_rate: settings.default_vat_rate,
            reduced_vat_rate: settings.reduced_vat_rate,
            include_vat_in_prices: settings.include_vat_in_prices,
            enable_vat_reporting: settings.enable_vat_reporting
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'BTW instellingen succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving tax settings:', error);
      setMessage({ type: 'error', text: 'Kon BTW instellingen niet opslaan' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-p max-w-4xl space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BTW Instellingen</h1>
        <p className="text-gray-600 mt-2">
          Beheer BTW tarieven en instellingen
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <Info className="h-4 w-4" />
          {message.text}
        </div>
      )}

      {/* BTW Tarieven */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5" />
          <h2 className="text-heading">BTW Tarieven</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Standaard BTW Tarief (%)
              </label>
              <div className="relative">
                <Percent className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={settings.default_vat_rate}
                  onChange={(e) => handleInputChange('default_vat_rate', parseFloat(e.target.value) || 0)}
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="21"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Standaard 21% in Nederland</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verlaagd BTW Tarief (%)
              </label>
              <div className="relative">
                <Percent className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={settings.reduced_vat_rate}
                  onChange={(e) => handleInputChange('reduced_vat_rate', parseFloat(e.target.value) || 0)}
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="9"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Verlaagd tarief 9% in Nederland</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BTW Nummer
            </label>
            <input
              type="text"
              value={settings.vat_number}
              onChange={(e) => handleInputChange('vat_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NL123456789B01"
            />
            <p className="text-xs text-gray-500 mt-1">Uw officiële BTW nummer</p>
          </div>
        </div>
      </div>

      {/* BTW Configuratie */}
      <div className="card">
        <h2 className="text-heading mb-4">BTW Configuratie</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">BTW Inbegrepen in Prijzen</label>
              <p className="text-sm text-gray-500">Toon prijzen inclusief BTW aan klanten</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.include_vat_in_prices}
                onChange={(e) => handleInputChange('include_vat_in_prices', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">BTW Rapportage Inschakelen</label>
              <p className="text-sm text-gray-500">Genereer BTW rapporten voor de belastingdienst</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_vat_reporting}
                onChange={(e) => handleInputChange('enable_vat_reporting', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">BTW Informatie</p>
            <p>Deze instellingen worden toegepast op nieuwe facturen en behandelingen. Bestaande facturen blijven ongewijzigd. Raadpleeg uw accountant voor specifieke BTW regelgeving.</p>
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