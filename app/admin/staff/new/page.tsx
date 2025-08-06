'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { UserService } from '@/lib/services/userService';
import { useBusinessHours } from '@/lib/hooks/useBusinessHours';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  UserCog,
  Calendar,
  Save,
  ArrowLeft,
  Loader2,
  Clock
} from 'lucide-react';

interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff';
  working_hours: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
  active: boolean;
}

const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export default function NewStaffPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const router = useRouter();
  const { businessHours } = useBusinessHours();
  
  const [formData, setFormData] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff',
    working_hours: DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { start: '09:00', end: '17:00', enabled: false } // Start with all days disabled
    }), {}),
    active: true
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleWorkingHoursChange = (day: string, field: 'start' | 'end' | 'enabled', value: any) => {
    // Check if trying to enable a day when salon is closed
    if (field === 'enabled' && value === true && !isSalonOpenOnDay(day)) {
      setError(`De salon is gesloten op ${day}. Medewerkers kunnen niet werken op dagen dat de salon gesloten is.`);
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day],
          [field]: value
        }
      }
    }));
  };

  // Helper function to check if salon is open on a specific day
  const isSalonOpenOnDay = (dutchDay: string): boolean => {
    if (!businessHours) return true; // If no business hours loaded, allow all days
    
    // Map Dutch day names to English for business hours check
    const dutchToEnglish: Record<string, string> = {
      'maandag': 'monday',
      'dinsdag': 'tuesday',
      'woensdag': 'wednesday',
      'donderdag': 'thursday',
      'vrijdag': 'friday',
      'zaterdag': 'saturday',
      'zondag': 'sunday'
    };
    
    const englishDay = dutchToEnglish[dutchDay.toLowerCase()];
    if (!englishDay) return false;
    
    const dayHours = businessHours[englishDay as keyof typeof businessHours];
    return dayHours ? !dayHours.closed : false;
  };

  // Get salon hours for a specific day
  const getSalonHours = (dutchDay: string): { open: string; close: string } | null => {
    if (!businessHours) return null;
    
    const dutchToEnglish: Record<string, string> = {
      'maandag': 'monday',
      'dinsdag': 'tuesday',
      'woensdag': 'wednesday',
      'donderdag': 'thursday',
      'vrijdag': 'friday',
      'zaterdag': 'saturday',
      'zondag': 'sunday'
    };
    
    const englishDay = dutchToEnglish[dutchDay.toLowerCase()];
    if (!englishDay) return null;
    
    const dayHours = businessHours[englishDay as keyof typeof businessHours];
    if (!dayHours || dayHours.closed) return null;
    
    return {
      open: dayHours.open || '09:00',
      close: dayHours.close || '17:00'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const result = await UserService.create({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        active: formData.active,
        specializations: [], // Empty for pedicure salon
        working_hours: formData.working_hours
      });
      
      console.log('Staff member created:', result);
      
      // Redirect to staff list
      router.push('/admin/staff');
    } catch (err: any) {
      console.error('Error creating staff member:', err);
      setError(err.message || 'Er is een fout opgetreden bij het aanmaken van de medewerker');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-p max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/staff')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar medewerkers
        </button>
        
        <h1 className="text-3xl font-bold tracking-tight">Nieuwe Medewerker</h1>
        <p className="text-gray-600 mt-2">
          Maak een nieuw account aan voor een medewerker
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-heading">Persoonlijke Gegevens</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voornaam *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achternaam *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefoon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role & Access */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="h-5 w-5" />
            <h2 className="text-heading">Rol & Toegang</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={formData.role === 'staff'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50">
                    <div className="font-medium">Medewerker</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Kan afspraken beheren en klanten bekijken
                    </div>
                  </div>
                </label>
                
                <label className="relative">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50">
                    <div className="font-medium">Beheerder</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Volledige toegang tot alle functies
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Account is actief
              </label>
            </div>
          </div>
        </div>


        {/* Working Hours */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            <h2 className="text-heading">Werkuren</h2>
          </div>
          
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id={`day-${day}`}
                  checked={formData.working_hours[day].enabled}
                  onChange={(e) => handleWorkingHoursChange(day, 'enabled', e.target.checked)}
                  />
                <label htmlFor={`day-${day}`} className="w-24 text-sm font-medium capitalize">
                  {day}
                </label>
                
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={formData.working_hours[day].start}
                    onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                    disabled={!formData.working_hours[day].enabled}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <span className="text-gray-500">tot</span>
                  <input
                    type="time"
                    value={formData.working_hours[day].end}
                    onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                    disabled={!formData.working_hours[day].enabled}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/staff')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={saving || !formData.first_name || !formData.last_name || !formData.email}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Aanmaken...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Medewerker Aanmaken
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}