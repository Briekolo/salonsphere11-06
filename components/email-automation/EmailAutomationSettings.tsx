'use client'

import { useState, useRef, useEffect } from 'react'
import { Mail, Users, Clock, TrendingUp, Eye, AlertCircle, CheckCircle, XCircle, Edit3 } from 'lucide-react'
import { useEmailSettings, useUpdateEmailSettings, useEmailStats, useEmailLogs } from '@/lib/hooks/useEmailAutomation'
import { useEmailTemplates, useUpdateEmailTemplate } from '@/lib/hooks/useEmailTemplates'
import { useToast } from '@/components/providers/ToastProvider'

interface TemplateEditorProps {
  templateType: string
  title: string
  template: {subject: string, content: string}
  variables: string[]
  onSave: (subject: string, content: string) => void
  onCancel: () => void
}

function TemplateEditor({ templateType, title, template, variables, onSave, onCancel }: TemplateEditorProps) {
  const subjectRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [showHtmlInfo, setShowHtmlInfo] = useState(false)

  const handleSave = () => {
    const subject = subjectRef.current?.value || ''
    const content = contentRef.current?.value || ''
    onSave(subject, content)
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-medium text-gray-900 mb-4">{title} Template Bewerken</h4>
      
      {/* HTML Information Box */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Belangrijk: HTML E-mail Templates</p>
            <button
              onClick={() => setShowHtmlInfo(!showHtmlInfo)}
              className="text-xs text-amber-700 underline mt-1"
            >
              {showHtmlInfo ? 'Verberg informatie' : 'Wat is HTML? Klik hier voor uitleg'}
            </button>
            
            {showHtmlInfo && (
              <div className="mt-3 text-xs text-amber-800 space-y-2">
                <p><strong>Wat is HTML?</strong> HTML is de code die bepaalt hoe uw e-mail eruitziet. Het is als een recept voor de opmaak van uw e-mail.</p>
                
                <p><strong>Hoe werkt het?</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><code className="bg-amber-100 px-1">&lt;h1&gt;Tekst&lt;/h1&gt;</code> = Grote koptekst</li>
                  <li><code className="bg-amber-100 px-1">&lt;p&gt;Tekst&lt;/p&gt;</code> = Normale paragraaf</li>
                  <li><code className="bg-amber-100 px-1">&lt;strong&gt;Tekst&lt;/strong&gt;</code> = Vetgedrukte tekst</li>
                  <li><code className="bg-amber-100 px-1">&lt;br&gt;</code> = Nieuwe regel</li>
                </ul>
                
                <p><strong>Variabelen gebruiken:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Type <code className="bg-amber-100 px-1">{`{{client_name}}`}</code> om de naam van de klant in te voegen</li>
                  <li>Type <code className="bg-amber-100 px-1">{`{{appointment_date}}`}</code> voor de afspraakdatum</li>
                  <li>Deze worden automatisch vervangen met de juiste informatie</li>
                </ul>
                
                <p><strong>Tips voor aanpassen:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Wijzig alleen tekst tussen <code className="bg-amber-100 px-1">&gt;</code> en <code className="bg-amber-100 px-1">&lt;</code></li>
                  <li>Laat <code className="bg-amber-100 px-1">style=</code> regels intact voor de opmaak</li>
                  <li>Test altijd uw wijzigingen met een test e-mail</li>
                  <li>Maak een kopie van de originele code voordat u wijzigt</li>
                </ul>
                
                <p className="font-medium text-amber-900 mt-2">⚠️ Let op: Verkeerde HTML kan ervoor zorgen dat uw e-mail er vreemd uitziet. Bij twijfel, vraag om hulp!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-mail Onderwerp
          </label>
          <input
            ref={subjectRef}
            type="text"
            defaultValue={template.subject}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Voer het onderwerp in..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Beschikbare variabelen: {variables.join(', ')}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-mail Inhoud (HTML Code)
          </label>
          <textarea
            ref={contentRef}
            rows={12}
            defaultValue={template.content}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
            placeholder="Voer de HTML code voor de e-mail in..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Beschikbare variabelen: {variables.join(', ')}
          </p>
        </div>
        
        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={handleSave}
            className="btn-primary text-sm"
          >
            Wijzigingen Opslaan
          </button>
          <button 
            onClick={onCancel}
            className="btn-outlined text-sm"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmailAutomationSettings() {
  const { data: settings, isLoading: settingsLoading } = useEmailSettings()
  const { data: stats, isLoading: statsLoading } = useEmailStats('this_month')
  const { data: recentLogs, isLoading: logsLoading } = useEmailLogs(10)
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates()
  const updateSettings = useUpdateEmailSettings()
  const updateTemplate = useUpdateEmailTemplate()
  const { showToast } = useToast()
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [templateData, setTemplateData] = useState<{[key: string]: {subject: string, content: string}}>({
    welcome: {
      subject: "🌟 Welkom bij {{salon_name}}!",
      content: `Beste {{first_name}},

Hartelijk welkom bij {{salon_name}}!

We zijn verheugd dat u deel uitmaakt van onze salon familie. Bij ons staat kwaliteit en persoonlijke aandacht voorop.

Heeft u vragen of wilt u een nieuwe afspraak maken? Neem gerust contact met ons op.

Met vriendelijke groet,
Het team van {{salon_name}}`
    },
    confirmation: {
      subject: "Afspraakbevestiging - {{service_name}} op {{appointment_date}}",
      content: `Beste {{client_name}},

Uw afspraak is bevestigd!

Afspraak Details:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Medewerker: {{staff_name}}
- Locatie: {{salon_name}}, {{salon_address}}

Wij verheugen ons op uw bezoek. Heeft u vragen? Neem gerust contact met ons op via {{salon_phone}} of {{salon_email}}.

Met vriendelijke groet,
Het team van {{salon_name}}`
    },
    reminder: {
      subject: "⏰ Herinnering: {{service_name}} morgen om {{appointment_time}}",
      content: `Beste {{client_name}},

Dit is een vriendelijke herinnering voor uw aanstaande afspraak:

Afspraak Details:
- Behandeling: {{service_name}}
- Datum: {{appointment_date}}
- Tijd: {{appointment_time}}
- Medewerker: {{staff_name}}
- Locatie: {{salon_name}}, {{salon_address}}

We kijken ernaar uit u te zien! Mocht u uw afspraak willen wijzigen of annuleren, neem dan zo spoedig mogelijk contact met ons op via {{salon_phone}}.

Met vriendelijke groet,
Het team van {{salon_name}}`
    }
  })

  // Load templates from database when they become available
  useEffect(() => {
    if (templates && templates.length > 0) {
      const newTemplateData: {[key: string]: {subject: string, content: string}} = {}
      
      templates.forEach(template => {
        if (template.type === 'welcome') {
          newTemplateData.welcome = {
            subject: template.subject_line || templateData.welcome.subject,
            content: template.html_content || templateData.welcome.content
          }
        } else if (template.type === 'appointment_confirmation' || template.type === 'booking_confirmation') {
          newTemplateData.confirmation = {
            subject: template.subject_line || templateData.confirmation.subject,
            content: template.html_content || templateData.confirmation.content
          }
        } else if (template.type === 'booking_reminder' || template.type === 'appointment_reminder') {
          newTemplateData.reminder = {
            subject: template.subject_line || templateData.reminder.subject,
            content: template.html_content || templateData.reminder.content
          }
        }
      })
      
      // Only update if we found templates
      if (Object.keys(newTemplateData).length > 0) {
        setTemplateData(prev => ({ ...prev, ...newTemplateData }))
      }
    }
  }, [templates])

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

  const handleSaveTemplate = async (templateType: string, subject: string, content: string) => {
    try {
      // Update local state
      setTemplateData(prev => ({
        ...prev,
        [templateType]: { subject, content }
      }))
      
      // Map frontend template type to database type
      let dbTemplateType = templateType
      if (templateType === 'confirmation') {
        dbTemplateType = 'appointment_confirmation'
      } else if (templateType === 'reminder') {
        dbTemplateType = 'appointment_reminder'
      }
      
      // Find the template in the database templates
      const dbTemplate = templates?.find(t => {
        if (templateType === 'confirmation') {
          return t.type === 'appointment_confirmation' || t.type === 'booking_confirmation'
        } else if (templateType === 'reminder') {
          return t.type === 'appointment_reminder' || t.type === 'booking_reminder'
        }
        return t.type === templateType
      })
      
      if (dbTemplate) {
        // Update the existing template in the database
        await updateTemplate.mutateAsync({
          id: dbTemplate.id!,
          data: {
            subject: subject,
            body_html: content,
            body_text: content // Simple plain text version
          }
        })
      }
      
      setEditingTemplate(null)
      showToast('Template succesvol opgeslagen', 'success')
    } catch (error) {
      console.error('Error saving template:', error)
      showToast('Er is een fout opgetreden bij het opslaan van de template', 'error')
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
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
                    <button
                      onClick={() => setEditingTemplate(editingTemplate === 'welcome' ? null : 'welcome')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Bewerken
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
                      <TrendingUp className="w-4 h-4" />
                      {stats?.welcome_emails_sent_today || 0} verzonden vandaag
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
                <div><strong>Onderwerp:</strong> {templateData.welcome.subject}</div>
                <div><strong>Inhoud:</strong> {templateData.welcome.content.substring(0, 100)}...</div>
              </div>
            </div>
          )}
          
          {editingTemplate === 'welcome' && (
            <TemplateEditor
              templateType="welcome"
              title="Welkomst E-mail"
              template={templateData.welcome}
              variables={['{{salon_name}}', '{{salon_address}}', '{{salon_phone}}', '{{salon_email}}', '{{client_name}}', '{{first_name}}']}
              onSave={(subject, content) => handleSaveTemplate('welcome', subject, content)}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </div>

        {/* Booking Confirmation */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
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
                    <button
                      onClick={() => setEditingTemplate(editingTemplate === 'confirmation' ? null : 'confirmation')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Bewerken
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
                      <TrendingUp className="w-4 h-4" />
                      {stats?.booking_confirmations_sent_today || 0} verzonden vandaag
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
                <div><strong>Onderwerp:</strong> {templateData.confirmation.subject}</div>
                <div><strong>Inhoud:</strong> {templateData.confirmation.content.substring(0, 100)}...</div>
              </div>
            </div>
          )}
          
          {editingTemplate === 'confirmation' && (
            <TemplateEditor
              templateType="confirmation"
              title="Afspraak Bevestiging"
              template={templateData.confirmation}
              variables={['{{salon_name}}', '{{salon_address}}', '{{salon_phone}}', '{{salon_email}}', '{{client_name}}', '{{service_name}}', '{{appointment_date}}', '{{appointment_time}}', '{{staff_name}}']}
              onSave={(subject, content) => handleSaveTemplate('confirmation', subject, content)}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </div>

        {/* Booking Reminder */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
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
                    <button
                      onClick={() => setEditingTemplate(editingTemplate === 'reminder' ? null : 'reminder')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Bewerken
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
                      <TrendingUp className="w-4 h-4" />
                      {stats?.booking_reminders_sent_today || 0} verzonden vandaag
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
                <div><strong>Onderwerp:</strong> {templateData.reminder.subject}</div>
                <div><strong>Inhoud:</strong> {templateData.reminder.content.substring(0, 100)}...</div>
              </div>
            </div>
          )}
          
          {editingTemplate === 'reminder' && (
            <TemplateEditor
              templateType="reminder"
              title="Afspraak Herinnering"
              template={templateData.reminder}
              variables={['{{salon_name}}', '{{salon_address}}', '{{salon_phone}}', '{{salon_email}}', '{{client_name}}', '{{service_name}}', '{{appointment_date}}', '{{appointment_time}}', '{{staff_name}}']}
              onSave={(subject, content) => handleSaveTemplate('reminder', subject, content)}
              onCancel={() => setEditingTemplate(null)}
            />
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