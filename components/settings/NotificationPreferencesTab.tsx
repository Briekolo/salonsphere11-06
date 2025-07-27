'use client';

import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings';
import { supabase } from '@/lib/supabase';
import { 
  Bell,
  Mail,
  MessageSquare,
  Users,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface NotificationPreferences {
  email: {
    new_bookings: boolean;
    cancellations: boolean;
    reminders: boolean;
    daily_summary: boolean;
    payment_received: boolean;
    low_inventory: boolean;
  };
  sms: {
    enabled: boolean;
    new_bookings: boolean;
    reminders: boolean;
    cancellations: boolean;
  };
  staff: {
    new_bookings: boolean;
    cancellations: boolean;
    no_shows: boolean;
    schedule_changes: boolean;
  };
  client_reminders: {
    appointment_reminder_hours: number;
    send_confirmation_email: boolean;
    send_thank_you_email: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  email: {
    new_bookings: true,
    cancellations: true,
    reminders: true,
    daily_summary: false,
    payment_received: true,
    low_inventory: true
  },
  sms: {
    enabled: false,
    new_bookings: false,
    reminders: false,
    cancellations: false
  },
  staff: {
    new_bookings: true,
    cancellations: true,
    no_shows: true,
    schedule_changes: true
  },
  client_reminders: {
    appointment_reminder_hours: 24,
    send_confirmation_email: true,
    send_thank_you_email: false
  }
};

export function NotificationPreferencesTab() {
  const { isAdmin } = useIsAdmin();
  const { tenantId } = useTenant();
  const { invalidateNotificationSettings } = useNotificationSettings();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchNotificationPreferences();
    }
  }, [tenantId]);

  const fetchNotificationPreferences = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('notification_preferences')
        .eq('id', tenantId)
        .single();

      if (!error && data?.notification_preferences) {
        setPreferences({
          ...defaultPreferences,
          ...data.notification_preferences
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      setMessage({ type: 'error', text: 'Kon meldingsinstellingen niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category: keyof NotificationPreferences, setting: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleNumberChange = (category: keyof NotificationPreferences, setting: string, value: number) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
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
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      // Invalidate cached notification settings to trigger re-fetch across all components
      invalidateNotificationSettings();
      
      setMessage({ type: 'success', text: 'Meldingsinstellingen succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setMessage({ type: 'error', text: 'Kon meldingsinstellingen niet opslaan' });
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Meldingen</h2>
        <p className="text-gray-600 mt-1">
          Stel in wanneer en hoe u meldingen wilt ontvangen
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {message.text}
        </div>
      )}

      {!isAdmin && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Alleen-lezen:</strong> U heeft geen beheerrechten om deze gegevens te wijzigen.
          </p>
        </div>
      )}

      {/* Email Notifications */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5" />
          <h3 className="text-lg font-medium">E-mail Meldingen</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Nieuwe afspraken</label>
              <p className="text-sm text-gray-500">Ontvang een e-mail bij nieuwe boekingen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.new_bookings}
                onChange={(e) => handleToggle('email', 'new_bookings', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Annuleringen</label>
              <p className="text-sm text-gray-500">Ontvang een e-mail bij geannuleerde afspraken</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.cancellations}
                onChange={(e) => handleToggle('email', 'cancellations', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Dagelijkse samenvatting</label>
              <p className="text-sm text-gray-500">Ontvang een dagelijks overzicht van afspraken</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.daily_summary}
                onChange={(e) => handleToggle('email', 'daily_summary', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Betalingen ontvangen</label>
              <p className="text-sm text-gray-500">Ontvang een e-mail bij ontvangen betalingen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.payment_received}
                onChange={(e) => handleToggle('email', 'payment_received', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Lage voorraad</label>
              <p className="text-sm text-gray-500">Ontvang een e-mail wanneer voorraad laag is</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.low_inventory}
                onChange={(e) => handleToggle('email', 'low_inventory', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-medium">SMS Meldingen</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">SMS functionaliteit vereist configuratie</p>
                <p>Om SMS berichten te kunnen versturen moet u eerst een SMS provider configureren in de admin instellingen.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">SMS inschakelen</label>
              <p className="text-sm text-gray-500">SMS berichten naar klanten</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sms.enabled}
                onChange={(e) => handleToggle('sms', 'enabled', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className={`space-y-4 ${!preferences.sms.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <div>
                <label className="font-medium">SMS bij nieuwe afspraken</label>
                <p className="text-sm text-gray-500">Verstuur SMS bevestiging bij boekingen</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms.new_bookings}
                  onChange={(e) => handleToggle('sms', 'new_bookings', e.target.checked)}
                  disabled={!isAdmin || !preferences.sms.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <div>
                <label className="font-medium">SMS herinneringen</label>
                <p className="text-sm text-gray-500">Verstuur SMS herinneringen voor afspraken</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms.reminders}
                  onChange={(e) => handleToggle('sms', 'reminders', e.target.checked)}
                  disabled={!isAdmin || !preferences.sms.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Notifications */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Personeel Meldingen</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Nieuwe afspraken</label>
              <p className="text-sm text-gray-500">Informeer personeel over nieuwe boekingen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.staff.new_bookings}
                onChange={(e) => handleToggle('staff', 'new_bookings', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">No-shows</label>
              <p className="text-sm text-gray-500">Informeer over klanten die niet komen opdagen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.staff.no_shows}
                onChange={(e) => handleToggle('staff', 'no_shows', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Agenda wijzigingen</label>
              <p className="text-sm text-gray-500">Informeer over wijzigingen in de planning</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.staff.schedule_changes}
                onChange={(e) => handleToggle('staff', 'schedule_changes', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Client Reminders */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-medium">Klant Herinneringen</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Herinnering versturen</label>
              <p className="text-sm text-gray-500">Aantal uren vooraf</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={preferences.client_reminders.appointment_reminder_hours}
                onChange={(e) => handleNumberChange('client_reminders', 'appointment_reminder_hours', parseInt(e.target.value) || 24)}
                disabled={!isAdmin}
                min="1"
                max="168"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <span className="text-sm text-gray-500">uur</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Bevestigings e-mail</label>
              <p className="text-sm text-gray-500">Verstuur bevestiging bij boeken</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.client_reminders.send_confirmation_email}
                onChange={(e) => handleToggle('client_reminders', 'send_confirmation_email', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Bedank e-mail</label>
              <p className="text-sm text-gray-500">Verstuur bedankje na afspraak</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.client_reminders.send_thank_you_email}
                onChange={(e) => handleToggle('client_reminders', 'send_thank_you_email', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
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
      )}
    </div>
  );
}