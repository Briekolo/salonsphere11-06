'use client';

import { useState } from 'react';
import { useStaffAuth } from '@/lib/hooks/useStaffAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  Shield,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export function StaffProfile() {
  const { user, permissions, loading: authLoading, refetch } = useStaffAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || ''
  });

  // Update mutation
  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('users')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          name: `${data.first_name} ${data.last_name}`
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setIsEditing(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['staff-auth'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  if (authLoading || !user) {
    return (
      <div className="mobile-p space-y-4 lg:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mijn Profiel</h1>
        <p className="text-gray-600 mt-1">
          Beheer je profiel en instellingen
        </p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading">Persoonlijke Informatie</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-sm"
            >
              Bewerken
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voornaam
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Achternaam
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefoonnummer
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="btn-primary"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Opslaan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    phone: user.phone || ''
                  });
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Naam</p>
                <p className="font-medium">{user.name || `${user.first_name} ${user.last_name}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefoon</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{user.phone || 'Niet ingesteld'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">Medewerker</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="card">
        <h2 className="text-heading mb-4">Permissies</h2>
        <p className="text-sm text-gray-600 mb-4">
          Je toegangsrechten binnen het systeem
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Alle afspraken bekijken</span>
            <span className={`text-sm ${permissions?.can_view_all_appointments ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_view_all_appointments ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Alle afspraken bewerken</span>
            <span className={`text-sm ${permissions?.can_edit_all_appointments ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_edit_all_appointments ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Klanten bekijken</span>
            <span className={`text-sm ${permissions?.can_view_clients ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_view_clients ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Klanten bewerken</span>
            <span className={`text-sm ${permissions?.can_edit_clients ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_edit_clients ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Financiële gegevens bekijken</span>
            <span className={`text-sm ${permissions?.can_view_financial ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_view_financial ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Eigen planning beheren</span>
            <span className={`text-sm ${permissions?.can_manage_own_schedule ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_manage_own_schedule ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Notities toevoegen aan afspraken</span>
            <span className={`text-sm ${permissions?.can_add_appointment_notes ? 'text-green-600' : 'text-gray-400'}`}>
              {permissions?.can_add_appointment_notes ? 'Toegestaan' : 'Niet toegestaan'}
            </span>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      {user.working_hours && (
        <div className="card">
          <h2 className="text-heading mb-4">Werkuren</h2>
          <p className="text-sm text-gray-600 mb-4">
            Je ingestelde werkuren (door beheerder ingesteld)
          </p>
          <div className="space-y-2">
            {Object.entries(user.working_hours).map(([day, hours]: [string, any]) => (
              <div key={day} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium capitalize">{day}</span>
                <span className="text-sm text-gray-600">
                  {hours.enabled ? `${hours.start} - ${hours.end}` : 'Vrij'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}