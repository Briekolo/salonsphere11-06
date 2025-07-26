'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Camera,
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

export default function SettingsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  
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
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
      toast({
        title: 'Fout',
        description: 'Kon salon profiel niet laden',
        variant: 'destructive',
      });
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;

    setUploadingLogo(true);
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/logo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('salon-assets')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('salon-assets')
        .getPublicUrl(fileName);

      // Update profile with new logo URL
      setProfile(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      toast({
        title: 'Succes',
        description: 'Logo succesvol geüpload',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Fout',
        description: 'Kon logo niet uploaden',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    
    setSaving(true);
    
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

      toast({
        title: 'Succes',
        description: 'Salon profiel succesvol bijgewerkt',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Fout',
        description: 'Kon profiel niet opslaan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salon Instellingen</h1>
        <p className="text-muted-foreground">
          Beheer uw salon profiel en algemene instellingen
        </p>
      </div>

      {/* Salon Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Salon Profiel
          </CardTitle>
          <CardDescription>
            Algemene informatie over uw salon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <Label>Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {profile.logo_url ? (
                    <img 
                      src={profile.logo_url} 
                      alt="Salon logo" 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <Label htmlFor="logo-upload">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      asChild
                    >
                      <span>
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploaden...
                          </>
                        ) : (
                          'Upload Logo'
                        )}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG tot 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Salon Naam *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Uw salon naam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@uwsalon.nl"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={profile.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Korte beschrijving van uw salon"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+31 6 12345678"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="www.uwsalon.nl"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresgegevens
          </CardTitle>
          <CardDescription>
            Locatie informatie van uw salon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Straat en Huisnummer</Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Hoofdstraat 123"
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postcode</Label>
              <Input
                id="postal_code"
                value={profile.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Amsterdam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                value={profile.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Nederland"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Zakelijke Gegevens</CardTitle>
          <CardDescription>
            BTW en KvK informatie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vat_number">BTW Nummer</Label>
              <Input
                id="vat_number"
                value={profile.vat_number}
                onChange={(e) => handleInputChange('vat_number', e.target.value)}
                placeholder="NL123456789B01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chamber_of_commerce">KvK Nummer</Label>
              <Input
                id="chamber_of_commerce"
                value={profile.chamber_of_commerce}
                onChange={(e) => handleInputChange('chamber_of_commerce', e.target.value)}
                placeholder="12345678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving || !profile.name || !profile.email}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Wijzigingen Opslaan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}