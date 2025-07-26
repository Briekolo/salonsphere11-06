'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Copy, ExternalLink, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TenantDetails {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  website?: string;
}

export default function TenantInfoPage() {
  const { isAdmin, isLoading: adminLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, subdomain, email, phone, address, city, website')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      setTenant(data);
    } catch (error) {
      console.error('Error fetching tenant:', error);
    } finally {
      setLoading(false);
    }
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

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="mobile-p">
        <div className="card text-center py-12">
          <p className="text-gray-600">Kon tenant informatie niet laden</p>
        </div>
      </div>
    );
  }

  const clientUrls = {
    local: `http://localhost:3001/${tenant.subdomain || tenant.id}/services`,
    subdomain: `https://${tenant.subdomain || tenant.id}.salonsphere.nl/services`,
    path: `https://salonsphere.nl/salon/${tenant.subdomain || tenant.id}/services`
  };

  return (
    <div className="mobile-p max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar dashboard
        </button>
        
        <h1 className="text-3xl font-bold tracking-tight">Tenant Informatie</h1>
        <p className="text-gray-600 mt-2">
          Uw salon gegevens en client module URLs
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-heading mb-4">Salon Gegevens</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Salon Naam</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {tenant.subdomain || 'Nog niet ingesteld'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefoon</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Adres</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {tenant.address ? `${tenant.address}, ${tenant.city || ''}` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tenant ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{tenant.id}</dd>
            </div>
          </dl>
        </div>

        {/* Client URLs */}
        <div className="card">
          <h2 className="text-heading mb-4">Client Module URLs</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gebruik deze URLs om uw client-facing pagina's te bekijken:
          </p>
          
          <div className="space-y-4">
            {/* Local Development */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Lokale Development</p>
                  <p className="text-sm font-mono text-gray-600 break-all">{clientUrls.local}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyToClipboard(clientUrls.local, 'local')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Kopieer URL"
                  >
                    {copied === 'local' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={clientUrls.local}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                    title="Open in nieuw tabblad"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Subdomain (Production) */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Subdomain URL (Productie)
                  </p>
                  <p className="text-sm font-mono text-gray-600 break-all">{clientUrls.subdomain}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyToClipboard(clientUrls.subdomain, 'subdomain')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Kopieer URL"
                  >
                    {copied === 'subdomain' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Path-based (Fallback) */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Path-based URL (Fallback)</p>
                  <p className="text-sm font-mono text-gray-600 break-all">{clientUrls.path}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyToClipboard(clientUrls.path, 'path')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Kopieer URL"
                  >
                    {copied === 'path' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Hoe te gebruiken:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Run eerst de database migratie om de subdomain velden toe te voegen</li>
            <li>Gebruik de lokale development URL om direct te testen</li>
            <li>De subdomain wordt automatisch gegenereerd op basis van uw salon naam</li>
            <li>In productie werkt de subdomain URL automatisch</li>
          </ol>
        </div>
      </div>
    </div>
  );
}