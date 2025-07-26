'use client';

import { useState } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { 
  Mail, 
  MessageSquare, 
  Bell,
  Settings,
  Send,
  Save,
  Loader2,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function NotificationsPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [emailSettings, setEmailSettings] = useState({
    appointmentConfirmation: true,
    appointmentReminder: true,
    appointmentCancellation: true,
    paymentConfirmation: true,
    promotionalEmails: false,
    newsletterEnabled: true
  });
  const [notificationSettings, setNotificationSettings] = useState({
    smsReminders: true,
    emailReminders: true,
    reminderTiming: 24, // hours before appointment
    marketingConsent: false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      alert('Notificatie instellingen opgeslagen!');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const emailTemplates = [
    {
      name: 'Afspraak Bevestiging',
      description: 'Automatisch verzonden na het maken van een afspraak',
      icon: <Calendar className="h-5 w-5" />,
      status: 'active',
      lastModified: '2024-06-10'
    },
    {
      name: 'Afspraak Herinnering',
      description: 'Verzonden 24 uur voor de afspraak',
      icon: <Bell className="h-5 w-5" />,
      status: 'active',
      lastModified: '2024-06-08'
    },
    {
      name: 'Betaling Bevestiging',
      description: 'Verzonden na succesvolle betaling',
      icon: <CheckCircle className="h-5 w-5" />,
      status: 'active',
      lastModified: '2024-06-05'
    },
    {
      name: 'Promotie Email',
      description: 'Voor marketingcampagnes en aanbiedingen',
      icon: <Send className="h-5 w-5" />,
      status: 'draft',
      lastModified: '2024-06-01'
    }
  ];

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email & Notificaties</h1>
        <p className="text-gray-600 mt-2">
          Configureer email templates en notificatie instellingen
        </p>
      </div>

      {/* Email Templates */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5" />
          <h2 className="text-heading">Email Templates</h2>
        </div>
        
        <div className="space-y-4">
          {emailTemplates.map((template, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <div className="text-gray-600">{template.icon}</div>
                </div>
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <p className="text-xs text-gray-500">Laatst gewijzigd: {template.lastModified}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`status-chip ${
                  template.status === 'active' 
                    ? 'bg-icon-green-bg text-icon-green' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {template.status === 'active' ? 'Actief' : 'Concept'}
                </span>
                <button className="btn-outlined text-sm">
                  <Settings className="h-4 w-4" />
                  Bewerken
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                checked={emailSettings.appointmentConfirmation}
                onChange={(e) => setEmailSettings(prev => ({
                  ...prev,
                  appointmentConfirmation: e.target.checked
                }))}
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
                checked={emailSettings.appointmentReminder}
                onChange={(e) => setEmailSettings(prev => ({
                  ...prev,
                  appointmentReminder: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Betaling Bevestigingen</p>
              <p className="text-sm text-gray-600">Bevestiging van succesvolle betalingen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings.paymentConfirmation}
                onChange={(e) => setEmailSettings(prev => ({
                  ...prev,
                  paymentConfirmation: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Promotionele Emails</p>
              <p className="text-sm text-gray-600">Marketing emails en aanbiedingen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings.promotionalEmails}
                onChange={(e) => setEmailSettings(prev => ({
                  ...prev,
                  promotionalEmails: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SMS & Push Notifications */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-heading">SMS & Push Notificaties</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">SMS Herinneringen</p>
              <p className="text-sm text-gray-600">SMS berichten voor afspraak herinneringen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.smsReminders}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  smsReminders: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Herinnering Timing
            </label>
            <select
              value={notificationSettings.reminderTiming}
              onChange={(e) => setNotificationSettings(prev => ({
                ...prev,
                reminderTiming: parseInt(e.target.value)
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
    </div>
  );
}