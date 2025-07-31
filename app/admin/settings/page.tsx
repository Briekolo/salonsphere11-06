'use client';

import { useState, useEffect, useRef } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useToast } from '@/components/providers/ToastProvider';
import { supabase } from '@/lib/supabase';
import { ValidationService } from '@/lib/services/validationService';
import { ToastContainer } from '@/components/ui/Toast';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Camera,
  Save,
  Loader2,
  Upload,
  X
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

export default function SettingsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const { toasts, showToast, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
      showToast('Kon salon profiel niet laden', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SalonProfile, value: string) => {
    setProfile(prev => ({
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
    
    // Validate required fields
    if (!profile.name.trim()) {
      errors.name = 'Salon naam is verplicht';
    }
    
    // Validate email - only if provided
    if (profile.email.trim()) {
      const emailValidation = ValidationService.validateEmail(profile.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error!;
      }
    }
    
    // Validate phone - only if provided
    if (profile.phone.trim()) {
      const phoneValidation = ValidationService.validatePhone(profile.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error!;
      }
    }
    
    // Validate postal code - only if provided
    if (profile.postal_code.trim()) {
      const postalValidation = ValidationService.validatePostalCode(profile.postal_code);
      if (!postalValidation.isValid) {
        errors.postal_code = postalValidation.error!;
      }
    }
    
    // Validate VAT number - only if provided
    if (profile.vat_number.trim()) {
      const vatValidation = ValidationService.validateVATNumber(profile.vat_number);
      if (!vatValidation.isValid) {
        errors.vat_number = vatValidation.error!;
      }
    }
    
    // Validate KvK number - only if provided
    if (profile.chamber_of_commerce.trim()) {
      const kvkValidation = ValidationService.validateKvKNumber(profile.chamber_of_commerce);
      if (!kvkValidation.isValid) {
        errors.chamber_of_commerce = kvkValidation.error!;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2";
    const errorClass = validationErrors[fieldName] 
      ? "border-red-300 focus:ring-red-500" 
      : "border-gray-300 focus:ring-primary-500";
    return `${baseClass} ${errorClass}`;
  };

  const getInputWithIconClassName = (fieldName: string) => {
    const baseClass = "w-full pl-10 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2";
    const errorClass = validationErrors[fieldName] 
      ? "border-red-300 focus:ring-red-500" 
      : "border-gray-300 focus:ring-primary-500";
    return `${baseClass} ${errorClass}`;
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Alleen afbeeldingen zijn toegestaan', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Afbeelding mag maximaal 5MB groot zijn', 'error');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${tenantId}/logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath);

      // Update profile state
      setProfile(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      showToast('Logo succesvol geüpload', 'success');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('Kon logo niet uploaden', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setProfile(prev => ({
      ...prev,
      logo_url: ''
    }));
    showToast('Logo verwijderd', 'info');
  };

  const handleSave = async () => {
    if (!tenantId) {
      showToast('Geen tenant ID gevonden', 'error');
      return;
    }
    
    console.log('Starting save with profile:', profile);
    console.log('TenantId:', tenantId);
    
    // Validate form before saving
    if (!validateForm()) {
      console.log('Validation failed, errors:', validationErrors);
      showToast('Controleer de invoervelden en probeer opnieuw', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare update data - only include non-empty values where appropriate
      const updateData = {
        name: profile.name?.trim() || '',
        description: profile.description?.trim() || '',
        email: profile.email?.trim() || '',
        phone: profile.phone?.trim() || '',
        website: profile.website?.trim() || '',
        address: profile.address?.trim() || '',
        city: profile.city?.trim() || '',
        postal_code: profile.postal_code?.trim() || '',
        country: profile.country?.trim() || 'Nederland',
        vat_number: profile.vat_number?.trim() || '',
        chamber_of_commerce: profile.chamber_of_commerce?.trim() || '',
        logo_url: profile.logo_url || '',
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating with data:', updateData);

      const { data, error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful, data:', data);
      console.log('[Admin Settings] Tenant data updated - real-time subscribers should be notified');
      showToast('Salon profiel succesvol bijgewerkt', 'success');
      
      // Refresh the profile data to confirm save
      await fetchSalonProfile();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      showToast(`Kon profiel niet opslaan: ${errorMessage}`, 'error');
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
        <h1 className="text-3xl font-bold tracking-tight">Salon Instellingen</h1>
        <p className="text-gray-600 mt-2">
          Beheer uw salon profiel en algemene instellingen
        </p>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Salon Profile */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5" />
          <h2 className="text-heading">Salon Profiel</h2>
        </div>
        
        <div className="space-y-4">
          {/* Logo Upload Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Salon Logo</h3>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {profile.logo_url ? (
                  <div className="relative">
                    <img
                      src={profile.logo_url}
                      alt="Salon logo"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? 'Uploaden...' : profile.logo_url ? 'Logo Vervangen' : 'Logo Uploaden'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG of GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salon Naam *
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={getInputClassName('name')}
                placeholder="Uw salon naam"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={getInputWithIconClassName('email')}
                  placeholder="info@uwsalon.nl"
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              value={profile.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Korte beschrijving van uw salon"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefoon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={getInputWithIconClassName('phone')}
                  placeholder="+31 6 12345678"
                />
              </div>
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={getInputWithIconClassName('website')}
                  placeholder="www.uwsalon.nl"
                />
              </div>
              {validationErrors.website && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.website}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5" />
          <h2 className="text-heading">Adresgegevens</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Straat en Huisnummer
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={getInputClassName('address')}
              placeholder="Hoofdstraat 123"
            />
            {validationErrors.address && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={profile.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                className={getInputClassName('postal_code')}
                placeholder="1234 AB"
              />
              {validationErrors.postal_code && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.postal_code}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plaats
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={getInputClassName('city')}
                placeholder="Amsterdam"
              />
              {validationErrors.city && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land
              </label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={getInputClassName('country')}
                placeholder="Nederland"
              />
              {validationErrors.country && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="card">
        <h2 className="text-heading mb-4">Zakelijke Gegevens</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BTW Nummer
            </label>
            <input
              type="text"
              value={profile.vat_number}
              onChange={(e) => handleInputChange('vat_number', e.target.value)}
              className={getInputClassName('vat_number')}
              placeholder="NL123456789B01"
            />
            {validationErrors.vat_number && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.vat_number}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KvK Nummer
            </label>
            <input
              type="text"
              value={profile.chamber_of_commerce}
              onChange={(e) => handleInputChange('chamber_of_commerce', e.target.value)}
              className={getInputClassName('chamber_of_commerce')}
              placeholder="12345678"
            />
            {validationErrors.chamber_of_commerce && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.chamber_of_commerce}</p>
            )}
          </div>
        </div>
      </div>


      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !profile.name.trim()}
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