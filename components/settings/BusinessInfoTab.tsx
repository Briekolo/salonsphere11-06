'use client';

import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useBusinessInfo } from '@/lib/hooks/useBusinessInfo';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Save,
  Loader2
} from 'lucide-react';

interface SalonProfile {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  vat_number: string;
  chamber_of_commerce: string;
  logo_url?: string;
}

export function BusinessInfoTab() {
  const { isAdmin } = useIsAdmin();
  const { tenantId } = useTenant();
  const { invalidateBusinessInfo } = useBusinessInfo();
  
  const [profile, setProfile] = useState<SalonProfile>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Nederland',
    vat_number: '',
    chamber_of_commerce: '',
    logo_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchSalonProfile();
    }
  }, [tenantId]);

  const fetchSalonProfile = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (!error && data) {
        setProfile({
          name: data.name || '',
          description: data.description || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          country: data.country || 'Nederland',
          vat_number: data.vat_number || '',
          chamber_of_commerce: data.chamber_of_commerce || '',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching salon profile:', error);
      setMessage({ type: 'error', text: 'Kon salon profiel niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SalonProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
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
          name: profile.name,
          description: profile.description,
          email: profile.email,
          phone: profile.phone,
          website: profile.website,
          address: profile.address,
          city: profile.city,
          postal_code: profile.postal_code,
          country: profile.country,
          vat_number: profile.vat_number,
          chamber_of_commerce: profile.chamber_of_commerce,
          logo_url: profile.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      // Invalidate cached business info to trigger re-fetch across all components
      invalidateBusinessInfo();
      
      setMessage({ type: 'success', text: 'Salon profiel succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Kon profiel niet opslaan' });
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold">Bedrijfsinformatie</h2>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
          Beheer de basisgegevens van uw salon
        </p>
      </div>

      {message && (
        <div className={`p-3 sm:p-4 rounded-lg text-xs sm:text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {!isAdmin && (
        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-xs sm:text-sm">
            <strong>Alleen-lezen:</strong> U heeft geen beheerrechten om deze gegevens te wijzigen.
          </p>
        </div>
      )}

      {/* Salon Profile */}
      <div className="card p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          <h3 className="text-sm sm:text-base lg:text-lg font-medium">Salon Profiel</h3>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Salon Naam *
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                placeholder="Uw salon naam"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isAdmin}
                  className="w-full pl-8 sm:pl-10 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                  placeholder="info@uwsalon.nl"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              value={profile.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isAdmin}
              rows={3}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              placeholder="Korte beschrijving van uw salon"
            />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Telefoon
              </label>
              <div className="relative">
                <Phone className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isAdmin}
                  className="w-full pl-8 sm:pl-10 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                  placeholder="+31 6 12345678"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isAdmin}
                  className="w-full pl-8 sm:pl-10 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                  placeholder="www.uwsalon.nl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          <h3 className="text-sm sm:text-base lg:text-lg font-medium">Adresgegevens</h3>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Straat en Huisnummer
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={!isAdmin}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              placeholder="Hoofdstraat 123"
            />
          </div>
          
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={profile.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                placeholder="1234 AB"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Plaats
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                placeholder="Amsterdam"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Land
              </label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
                placeholder="Nederland"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="card p-3 sm:p-4 lg:p-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4">Zakelijke Gegevens</h3>
        
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              BTW Nummer
            </label>
            <input
              type="text"
              value={profile.vat_number}
              onChange={(e) => handleInputChange('vat_number', e.target.value)}
              disabled={!isAdmin}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              placeholder="NL123456789B01"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              KvK Nummer
            </label>
            <input
              type="text"
              value={profile.chamber_of_commerce}
              onChange={(e) => handleInputChange('chamber_of_commerce', e.target.value)}
              disabled={!isAdmin}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              placeholder="12345678"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !profile.name || !profile.email}
            className="btn-primary text-xs sm:text-sm w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                Wijzigingen Opslaan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}