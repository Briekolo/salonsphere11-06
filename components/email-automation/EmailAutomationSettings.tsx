'use client'

import { useState } from 'react'
import { Mail, Users, Clock, TrendingUp, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useEmailSettings, useUpdateEmailSettings, useEmailStats, useEmailLogs } from '@/lib/hooks/useEmailAutomation'
import { useToast } from '@/components/providers/ToastProvider'

export function EmailAutomationSettings() {
  const { data: settings, isLoading: settingsLoading } = useEmailSettings()
  const { data: stats, isLoading: statsLoading } = useEmailStats('this_month')
  const { data: recentLogs, isLoading: logsLoading } = useEmailLogs(10)
  const updateSettings = useUpdateEmailSettings()
  const { showToast } = useToast()
  const [showPreview, setShowPreview] = useState<string | null>(null)

  const handleToggle = async (type: 'welcome_email_enabled' | 'booking_confirmation_enabled' | 'booking_reminder_enabled', enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({ [type]: enabled })
      showToast(
        enabled ? 'E-mail automatisering ingeschakeld' : 'E-mail automatisering uitgeschakeld',
        'success'
      )
    } catch (error) {
      console.error('Error updating settings:', error)
      showToast('Er is een fout opgetreden bij het bijwerken van de instellingen', 'error')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Verzonden'
      case 'failed':
        return 'Mislukt'
      case 'pending':
        return 'In behandeling'
      default:
        return status
    }
  }

  const getEmailTypeText = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'Welkomst'
      case 'booking_confirmation':
        return 'Bevestiging'
      case 'booking_reminder':
        return 'Herinnering'
      default:
        return type
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (settingsLoading) {
    return (
      <div className="mobile-p space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
            Instellingen laden...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-p space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-mail Automatisering</h1>
        <p className="text-gray-600">Beheer automatische e-mails voor uw salon</p>
      </div>

      {/* Email Automation Cards */}
      <div className="space-y-4">
        {/* Welcome Email */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-2xl">✉️</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Welkomst E-mail</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreview(showPreview === 'welcome' ? null : 'welcome')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voorbeeld
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings?.welcome_email_enabled || false}
                        onChange={(e) => handleToggle('welcome_email_enabled', e.target.checked)}
                        className="sr-only peer"
                        disabled={updateSettings.isPending}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Stuur automatisch een welkomstmail naar nieuwe klanten wanneer ze voor het eerst boeken.
                </p>
                {!statsLoading && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      {stats?.welcome_emails_sent_this_month || 0} verzonden deze maand
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      📊 {stats?.welcome_emails_sent_today || 0} verzonden vandaag
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showPreview === 'welcome' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">E-mail Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Onderwerp:</strong> 🌟 Welkom bij [Salon Naam]!</div>
                <div><strong>Inhoud:</strong> Hartelijk welkom bij onze salon! We zijn verheugd dat u deel uitmaakt van onze salon familie...</div>
              </div>
            </div>
          )}
        </div>

        {/* Booking Confirmation */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-2xl">📅</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Afspraak Bevestiging</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreview(showPreview === 'confirmation' ? null : 'confirmation')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voorbeeld
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings?.booking_confirmation_enabled || false}
                        onChange={(e) => handleToggle('booking_confirmation_enabled', e.target.checked)}
                        className="sr-only peer"
                        disabled={updateSettings.isPending}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Stuur een bevestiging wanneer een medewerker een afspraak maakt. Klanten die zelf boeken krijgen altijd een bevestiging.
                </p>
                {!statsLoading && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      {stats?.booking_confirmations_sent_this_month || 0} verzonden deze maand
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      📊 {stats?.booking_confirmations_sent_today || 0} verzonden vandaag
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showPreview === 'confirmation' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">E-mail Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Onderwerp:</strong> Afspraakbevestiging - [Behandeling] op [Datum]</div>
                <div><strong>Inhoud:</strong> Uw afspraak is bevestigd! Hierbij bevestigen wij uw afspraak met alle details...</div>
              </div>
            </div>
          )}
        </div>

        {/* Booking Reminder */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-2xl">⏰</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Afspraak Herinnering</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreview(showPreview === 'reminder' ? null : 'reminder')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voorbeeld
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings?.booking_reminder_enabled || false}
                        onChange={(e) => handleToggle('booking_reminder_enabled', e.target.checked)}
                        className="sr-only peer"
                        disabled={updateSettings.isPending}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Stuur 24 uur voor de afspraak een herinnering naar de klant.
                </p>
                {!statsLoading && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      {stats?.booking_reminders_sent_this_month || 0} verzonden deze maand
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      📊 {stats?.booking_reminders_sent_today || 0} verzonden vandaag
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showPreview === 'reminder' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">E-mail Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Onderwerp:</strong> ⏰ Herinnering: [Behandeling] morgen om [Tijd]</div>
                <div><strong>Inhoud:</strong> Dit is een vriendelijke herinnering voor uw aanstaande afspraak morgen...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overall Stats */}
      {!statsLoading && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">E-mail Statistieken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats?.total_emails_sent_today || 0}</div>
              <div className="text-sm text-gray-600">Vandaag verzonden</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.total_emails_sent_this_month || 0}</div>
              <div className="text-sm text-gray-600">Deze maand</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.welcome_emails_sent_this_month || 0}</div>
              <div className="text-sm text-gray-600">Welkomst e-mails</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.booking_confirmations_sent_this_month || 0}</div>
              <div className="text-sm text-gray-600">Bevestigingen</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Email Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Verzonden E-mails</h3>
        </div>
        
        {logsLoading ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              Activiteit laden...
            </div>
          </div>
        ) : recentLogs && recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">Type</th>
                  <th className="text-left py-2 font-medium text-gray-700">Ontvanger</th>
                  <th className="text-left py-2 font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 font-medium text-gray-700">Tijd</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100">
                    <td className="py-2">{getEmailTypeText(log.email_type)}</td>
                    <td className="py-2 text-gray-600">{log.recipient_email}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        <span>{getStatusText(log.status)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-gray-500">{formatTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Nog geen e-mails verzonden</p>
          </div>
        )}
      </div>

    </div>
  )
}