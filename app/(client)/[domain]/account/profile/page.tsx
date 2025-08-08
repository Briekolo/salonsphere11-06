'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuthContext } from '@/components/client/auth/ClientAuthProvider';
import { useTenant } from '@/lib/client/tenant-context';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { client, loading, isAuthenticated, updateProfile } = useClientAuthContext();
  const { tenant } = useTenant();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    marketing_consent: false
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/${resolvedParams.domain}/auth/login`);
    }
  }, [loading, isAuthenticated, router, resolvedParams.domain]);

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        marketing_consent: client.marketing_consent || false
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await updateProfile({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      marketing_consent: formData.marketing_consent
    });

    setSaving(false);
    
    if (error) {
      setMessage({ type: 'error', text: 'Er is een fout opgetreden bij het bijwerken van uw profiel.' });
    } else {
      setMessage({ type: 'success', text: 'Uw profiel is succesvol bijgewerkt!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E3ECFB] rounded-xl mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#7091D9]" />
          </div>
          <p className="text-base text-gray-600">Profiel laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !client) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href={`/${resolvedParams.domain}/account`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#010009] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Terug naar account</span>
      </Link>

      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
        <h1 className="text-2xl sm:text-3xl font-medium text-[#010009] mb-2" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
          Mijn profiel
        </h1>
        <p className="text-gray-600">
          Beheer uw persoonlijke gegevens bij {tenant?.name}
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Persoonlijke gegevens
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Voornaam
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Achternaam
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Contactgegevens
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">E-mailadres kan niet worden gewijzigd</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoonnummer
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent"
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Voorkeuren
            </h2>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.marketing_consent}
                onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                className="mt-1 w-4 h-4 text-[#02011F] bg-white border-gray-300 rounded focus:ring-[#02011F]"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Ontvang marketingberichten
                </span>
                <p className="text-sm text-gray-500 mt-0.5">
                  Blijf op de hoogte van speciale aanbiedingen en nieuws van {tenant?.name}
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#02011F] text-white font-medium rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50"
              style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Wijzigingen opslaan</span>
                </>
              )}
            </button>
            
            <Link
              href={`/${resolvedParams.domain}/account/security`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-300 text-[#010009] font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
              style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
              <Lock className="h-5 w-5" />
              <span>Wachtwoord wijzigen</span>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}