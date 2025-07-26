'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { 
  Link2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Save,
  Loader2
} from 'lucide-react';

interface DomainSettings {
  subdomain?: string;
  custom_domain?: string;
  domain_verified?: boolean;
}

export default function DomainSettingsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  
  const [settings, setSettings] = useState<DomainSettings>({
    subdomain: '',
    custom_domain: '',
    domain_verified: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchDomainSettings();
    }
  }, [tenantId]);

  const fetchDomainSettings = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('subdomain, custom_domain, domain_verified')
        .eq('id', tenantId)
        .single();

      if (!error && data) {
        setSettings({
          subdomain: data.subdomain || '',
          custom_domain: data.custom_domain || '',
          domain_verified: data.domain_verified || false
        });
      }
    } catch (error) {
      console.error('Error fetching domain settings:', error);
      setMessage({ type: 'error', text: 'Kon domein instellingen niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DomainSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          subdomain: settings.subdomain,
          custom_domain: settings.custom_domain,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Domein instellingen succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving domain settings:', error);
      setMessage({ type: 'error', text: 'Kon instellingen niet opslaan' });
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
    <div className="mobile-p max-w-5xl space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Domein Instellingen</h1>
        <p className="text-gray-600 mt-2">
          Beheer uw salon subdomain en eigen domein naam
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Domain Settings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Link2 className="h-5 w-5" />
          <h2 className="text-heading">Domein Configuratie</h2>
        </div>
        
        <div className="space-y-6">
          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subdomain
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={settings.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="mijn-salon"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-xl text-gray-600">
                    .salonsphere.nl
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Uw klanten kunnen uw salon bereiken via: https://{settings.subdomain || 'mijn-salon'}.salonsphere.nl
                </p>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eigen Domein (Optioneel)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={settings.custom_domain}
                onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="www.mijnsalon.nl"
              />
              
              {settings.custom_domain && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                  settings.domain_verified 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-yellow-50 text-yellow-800'
                }`}>
                  {settings.domain_verified ? (
                    <>
                      <CheckCircle className="h-4 w-4 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Domein geverifieerd</p>
                        <p className="text-xs mt-1">Uw eigen domein is actief en werkend.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Domein verificatie vereist</p>
                        <p className="text-xs mt-1">
                          Voeg de volgende DNS records toe aan uw domein:
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="bg-white rounded p-2 font-mono text-xs">
                            <div className="flex items-center justify-between">
                              <span>CNAME: {settings.custom_domain} → {settings.subdomain}.salonsphere.nl</span>
                              <button
                                onClick={() => copyToClipboard(`${settings.subdomain}.salonsphere.nl`, 'cname')}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                              >
                                {copied === 'cname' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Client URLs */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Client Module URLs</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Subdomain URL</p>
                    <p className="text-sm font-mono text-gray-700">
                      https://{settings.subdomain || '[subdomain]'}.salonsphere.nl
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`https://${settings.subdomain}.salonsphere.nl`, 'subdomain-url')}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={!settings.subdomain}
                  >
                    {copied === 'subdomain-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {settings.custom_domain && settings.domain_verified && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Eigen Domein URL</p>
                      <p className="text-sm font-mono text-gray-700">
                        https://{settings.custom_domain}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`https://${settings.custom_domain}`, 'custom-url')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copied === 'custom-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Hoe werkt het?</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Uw subdomain is direct beschikbaar na het opslaan</li>
              <li>• Voor een eigen domein moet u DNS records configureren bij uw domein provider</li>
              <li>• Verificatie van een eigen domein kan tot 48 uur duren</li>
              <li>• Beide URLs blijven altijd werken (subdomain en eigen domein)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !settings.subdomain}
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