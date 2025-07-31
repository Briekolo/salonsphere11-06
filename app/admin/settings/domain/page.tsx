'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useToast } from '@/components/providers/ToastProvider';
import { supabase } from '@/lib/supabase';
import { ValidationService } from '@/lib/services/validationService';
import { DomainService } from '@/lib/services/domainService';
import { ToastContainer } from '@/components/ui/Toast';
import { 
  Link2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Save,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface DomainSettings {
  subdomain?: string;
  custom_domain?: string;
  domain_verified?: boolean;
}

interface SubdomainStatus {
  checking: boolean;
  available: boolean | null;
  error?: string;
}

interface DomainVerificationStatus {
  verifying: boolean;
  verified: boolean | null;
  error?: string;
  suggestions?: string[];
}

export default function DomainSettingsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const { toasts, showToast, removeToast } = useToast();
  
  const [settings, setSettings] = useState<DomainSettings>({
    subdomain: '',
    custom_domain: '',
    domain_verified: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>({
    checking: false,
    available: null
  });
  const [domainVerificationStatus, setDomainVerificationStatus] = useState<DomainVerificationStatus>({
    verifying: false,
    verified: null
  });

  useEffect(() => {
    if (tenantId) {
      fetchDomainSettings();
    }
  }, [tenantId]);

  // Debounced subdomain availability check
  const checkSubdomainAvailability = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({
        checking: false,
        available: null
      });
      return;
    }

    // Skip check if it's the current subdomain
    if (subdomain === settings.subdomain) {
      setSubdomainStatus({
        checking: false,
        available: true
      });
      return;
    }

    setSubdomainStatus({
      checking: true,
      available: null
    });

    try {
      const result = await DomainService.checkSubdomainAvailability(subdomain, tenantId);
      
      setSubdomainStatus({
        checking: false,
        available: result.available,
        error: result.error
      });
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      setSubdomainStatus({
        checking: false,
        available: null,
        error: 'Kon beschikbaarheid niet controleren'
      });
    }
  }, [tenantId, settings.subdomain]);

  // Debounce the availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settings.subdomain) {
        checkSubdomainAvailability(settings.subdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [settings.subdomain, checkSubdomainAvailability]);

  // Domain verification function
  const verifyDomain = useCallback(async (domain: string) => {
    if (!domain || !settings.subdomain) {
      return;
    }

    setDomainVerificationStatus({
      verifying: true,
      verified: null
    });

    try {
      const expectedTarget = `${settings.subdomain}.salonsphere.nl`;
      const result = await DomainService.verifyDomainConfiguration(domain, expectedTarget);
      
      setDomainVerificationStatus({
        verifying: false,
        verified: result.verified,
        error: result.error,
        suggestions: result.suggestions
      });

      if (result.verified) {
        showToast('Domein succesvol geverifieerd!', 'success');
        // Update the domain_verified status in the database
        await supabase
          .from('tenants')
          .update({ 
            domain_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', tenantId);
        
        // Refresh settings to show updated verification status
        fetchDomainSettings();
      } else {
        showToast(result.error || 'Domein verificatie mislukt', 'error');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      setDomainVerificationStatus({
        verifying: false,
        verified: false,
        error: 'Kon domein niet verifiëren'
      });
      showToast('Er ging iets mis bij het verifiëren van het domein', 'error');
    }
  }, [settings.subdomain, tenantId, showToast]);

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
      showToast('Kon domein instellingen niet laden', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DomainSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate subdomain
    const subdomainValidation = ValidationService.validateSubdomain(settings.subdomain || '');
    if (!subdomainValidation.isValid) {
      errors.subdomain = subdomainValidation.error!;
    }
    
    // Validate custom domain if provided
    if (settings.custom_domain) {
      const domainValidation = ValidationService.validateDomain(settings.custom_domain);
      if (!domainValidation.isValid) {
        errors.custom_domain = domainValidation.error!;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "flex-1 px-3 py-2 border rounded-l-xl focus:outline-none focus:ring-2";
    const errorClass = validationErrors[fieldName] 
      ? "border-red-300 focus:ring-red-500" 
      : "border-gray-300 focus:ring-primary-500";
    return `${baseClass} ${errorClass}`;
  };
  
  const getStandardInputClassName = (fieldName: string) => {
    const baseClass = "w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2";
    const errorClass = validationErrors[fieldName] 
      ? "border-red-300 focus:ring-red-500" 
      : "border-gray-300 focus:ring-primary-500";
    return `${baseClass} ${errorClass}`;
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
    
    // Validate form before saving
    if (!validateForm()) {
      showToast('Controleer de invoervelden en probeer opnieuw', 'error');
      return;
    }
    
    // Check subdomain availability before saving
    if (settings.subdomain && subdomainStatus.available === false) {
      showToast('Subdomain is niet beschikbaar. Kies een andere naam.', 'error');
      return;
    }
    
    // Don't save if we're still checking availability
    if (settings.subdomain && subdomainStatus.checking) {
      showToast('Wacht even terwijl we de beschikbaarheid controleren', 'warning');
      return;
    }
    
    setSaving(true);
    
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

      showToast('Domein instellingen succesvol bijgewerkt', 'success');
    } catch (error) {
      console.error('Error saving domain settings:', error);
      showToast('Kon instellingen niet opslaan', 'error');
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />

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
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1">
                    <input
                      type="text"
                      value={settings.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value)}
                      className={getInputClassName('subdomain')}
                      placeholder="mijn-salon"
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-xl text-gray-600">
                      .salonsphere.nl
                    </span>
                  </div>
                  {/* Availability indicator */}
                  {settings.subdomain && settings.subdomain.length >= 3 && (
                    <div className="flex items-center">
                      {subdomainStatus.checking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : subdomainStatus.available === true ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : subdomainStatus.available === false ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Uw klanten kunnen uw salon bereiken via: https://{settings.subdomain || 'mijn-salon'}.salonsphere.nl
                </p>
                {/* Availability feedback */}
                {settings.subdomain && settings.subdomain.length >= 3 && subdomainStatus.available === true && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Subdomain is beschikbaar
                  </p>
                )}
                {settings.subdomain && settings.subdomain.length >= 3 && subdomainStatus.available === false && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {subdomainStatus.error || 'Subdomain is niet beschikbaar'}
                  </p>
                )}
                {validationErrors.subdomain && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.subdomain}</p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eigen Domein (Optioneel)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.custom_domain}
                  onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                  className={getStandardInputClassName('custom_domain')}
                  placeholder="www.mijnsalon.nl"
                />
                {settings.custom_domain && !settings.domain_verified && (
                  <button
                    onClick={() => verifyDomain(settings.custom_domain!)}
                    disabled={domainVerificationStatus.verifying || !settings.subdomain}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {domainVerificationStatus.verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Verificeren
                  </button>
                )}
              </div>
              {validationErrors.custom_domain && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.custom_domain}</p>
              )}
              
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
                      {/* Domain verification feedback */}
                      {domainVerificationStatus.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                          <p className="font-medium">Verificatie mislukt:</p>
                          <p>{domainVerificationStatus.error}</p>
                          {domainVerificationStatus.suggestions && (
                            <ul className="mt-1 list-disc list-inside space-y-1">
                              {domainVerificationStatus.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
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
              <li>• Uw subdomain wordt automatisch gecontroleerd op beschikbaarheid</li>
              <li>• Een groene vinkje betekent dat de subdomain beschikbaar is</li>
              <li>• Voor een eigen domein moet u DNS records configureren bij uw domein provider</li>
              <li>• Klik op "Verificeren" om te controleren of uw DNS instellingen correct zijn</li>
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
          disabled={
            saving || 
            !settings.subdomain || 
            subdomainStatus.checking || 
            (subdomainStatus.available === false)
          }
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