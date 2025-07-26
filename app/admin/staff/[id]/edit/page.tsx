'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
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
  Briefcase,
  Clock,
  History,
  Shield
} from 'lucide-react';

interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff';
  specializations: string[];
  working_hours: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
  active: boolean;
}

const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const SPECIALIZATIONS = [
  'Knippen', 'Kleuren', 'Föhnen', 'Styling', 
  'Extensions', 'Balayage', 'Highlights', 'Permanent',
  'Keratine behandeling', 'Hoofdhuid behandeling'
];

export default function EditStaffPage({ params }: { params: { id: string } }) {
  const { isAdmin, isLoading } = useRequireAdmin();
  const router = useRouter();
  
  const [formData, setFormData] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff',
    specializations: [],
    working_hours: DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { start: '09:00', end: '17:00', enabled: day !== 'zondag' }
    }), {}),
    active: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching staff data
    const fetchStaffData = async () => {
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setFormData({
          first_name: 'Emma',
          last_name: 'de Vries',
          email: 'emma@salon.nl',
          phone: '+31 6 12345678',
          role: 'staff',
          specializations: ['Knippen', 'Kleuren', 'Balayage'],
          working_hours: {
            maandag: { start: '09:00', end: '17:00', enabled: true },
            dinsdag: { start: '09:00', end: '17:00', enabled: true },
            woensdag: { start: '09:00', end: '17:00', enabled: true },
            donderdag: { start: '09:00', end: '20:00', enabled: true },
            vrijdag: { start: '09:00', end: '17:00', enabled: true },
            zaterdag: { start: '09:00', end: '16:00', enabled: true },
            zondag: { start: '09:00', end: '17:00', enabled: false }
          },
          active: true
        });
        setLastLogin('2025-06-15T14:30:00');
      } catch (err) {
        setError('Kon medewerker gegevens niet laden');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [params.id]);

  const handleInputChange = (field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecializationToggle = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleWorkingHoursChange = (day: string, field: 'start' | 'end' | 'enabled', value: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // TODO: Implement actual save logic
      console.log('Updating staff member:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to staff list
      router.push('/admin/staff');
    } catch (err) {
      setError('Er is een fout opgetreden bij het bijwerken van de medewerker');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Weet u zeker dat u een wachtwoord reset link wilt sturen?')) return;
    
    try {
      // TODO: Implement password reset
      alert('Wachtwoord reset link verstuurd naar ' + formData.email);
    } catch (err) {
      setError('Kon wachtwoord reset link niet versturen');
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
    <div className="mobile-p max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/staff')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar medewerkers
        </button>
        
        <h1 className="text-3xl font-bold tracking-tight">Medewerker Bewerken</h1>
        <p className="text-gray-600 mt-2">
          Wijzig de gegevens van {formData.first_name} {formData.last_name}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Account Info */}
      {lastLogin && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Laatste Login</p>
                <p className="text-sm text-blue-700">
                  {new Date(lastLogin).toLocaleString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetPassword}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900"
            >
              <Lock className="h-4 w-4" />
              Reset Wachtwoord
            </button>
          </div>
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
            <Shield className="h-5 w-5" />
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
                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Account is actief
              </label>
            </div>
            
            {!formData.active && (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <strong>Let op:</strong> Een inactief account kan niet inloggen
              </div>
            )}
          </div>
        </div>

        {/* Specializations */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5" />
            <h2 className="text-heading">Specialisaties</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIALIZATIONS.map((spec) => (
              <label key={spec} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.specializations.includes(spec)}
                  onChange={() => handleSpecializationToggle(spec)}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm">{spec}</span>
              </label>
            ))}
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
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
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
      </form>
    </div>
  );
}