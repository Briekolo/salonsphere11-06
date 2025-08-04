'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/lib/hooks/useNotificationSettings';
import { useEmailSettings, useUpdateEmailSettings } from '@/lib/hooks/useEmailAutomation';
import { 
  Mail, 
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

export default function NotificationsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { notificationSettings, isLoading: notificationLoading } = useNotificationSettings();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const { data: emailSettings, isLoading: emailLoading } = useEmailSettings();
  const updateEmailSettings = useUpdateEmailSettings();
  const [saving, setSaving] = useState(false);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update local state when notification settings are loaded
  useEffect(() => {
    if (notificationSettings) {
      setLocalNotificationSettings(notificationSettings);
      setHasUnsavedChanges(false);
    }
  }, [notificationSettings]);

  // Track unsaved changes
  useEffect(() => {
    if (notificationSettings && localNotificationSettings) {
      const hasChanges = JSON.stringify(notificationSettings) !== JSON.stringify(localNotificationSettings);
      setHasUnsavedChanges(hasChanges);
    }
  }, [localNotificationSettings, notificationSettings]);

  const handleSave = async () => {
    if (!localNotificationSettings || !hasUnsavedChanges) return;
    
    setSaving(true);
    setFeedback(null);
    try {
      await updateNotificationSettings.mutateAsync(localNotificationSettings);
      setFeedback({ type: 'success', message: 'Instellingen zijn succesvol opgeslagen' });
      setHasUnsavedChanges(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setFeedback({ 
        type: 'error', 
        message: 'Er is een fout opgetreden bij het opslaan van de instellingen' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || emailLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }


  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email & Notificaties</h1>
        <p className="text-gray-600 mt-2">
          Configureer email templates en notificatie instellingen
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* Email Settings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5" />
          <h2 className="text-heading">Email Instellingen</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Afspraak Bevestiging</p>
              <p className="text-sm text-gray-600">Automatische bevestiging bij nieuwe afspraken</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings?.booking_confirmation_enabled || false}
                onChange={(e) => updateEmailSettings.mutate({ booking_confirmation_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Afspraak Herinneringen</p>
              <p className="text-sm text-gray-600">Automatische herinneringen voor komende afspraken</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings?.booking_reminder_enabled || false}
                onChange={(e) => updateEmailSettings.mutate({ booking_reminder_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div 
            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => {
              setFeedback({ 
                type: 'error', 
                message: 'Betaling bevestigingen worden automatisch verstuurd via Mollie wanneer deze integratie beschikbaar is.' 
              });
              setTimeout(() => setFeedback(null), 4000);
            }}
          >
            <div>
              <p className="font-medium">Betaling Bevestigingen</p>
              <p className="text-sm text-gray-600">Bevestiging van succesvolle betalingen</p>
              <p className="text-xs text-orange-600">Binnenkort beschikbaar via Mollie</p>
            </div>
            <div className="relative inline-flex items-center">
              <div className="w-11 h-6 bg-gray-200 rounded-full opacity-50">
                <div className="absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Welkom Emails</p>
              <p className="text-sm text-gray-600">Welkomstbericht voor nieuwe klanten</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings?.welcome_email_enabled || false}
                onChange={(e) => updateEmailSettings.mutate({ welcome_email_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Email Timing */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h2 className="text-heading">Email Timing</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Herinnering Timing
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Wanneer moeten herinneringen worden verstuurd voor afspraken?
            </p>
            <select
              value={localNotificationSettings?.client_reminders?.appointment_reminder_hours || 24}
              onChange={(e) => setLocalNotificationSettings(prev => ({
                ...prev,
                client_reminders: {
                  ...prev?.client_reminders,
                  appointment_reminder_hours: parseInt(e.target.value)
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={2}>2 uur van tevoren</option>
              <option value={4}>4 uur van tevoren</option>
              <option value={12}>12 uur van tevoren</option>
              <option value={24}>24 uur van tevoren</option>
              <option value={48}>48 uur van tevoren</option>
            </select>
          </div>
        </div>
      </div>

      {/* GDPR Compliance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-heading">Privacy & Toestemming</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Marketing Toestemming Vereist</p>
              <p className="text-sm text-gray-600">Klanten moeten expliciet toestemming geven voor marketing emails</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">GDPR Compliance</p>
                <p>Alle email en SMS communicatie voldoet aan GDPR wetgeving. Klanten kunnen zich op elk moment uitschrijven en hun toestemming intrekken.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasUnsavedChanges && (
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