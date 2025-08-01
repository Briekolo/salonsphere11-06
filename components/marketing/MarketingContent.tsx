'use client'

import { useState } from 'react'
import { Plus, Mail, Users, TrendingUp, Calendar, Eye, MoreVertical, Trash2, XCircle } from 'lucide-react'
import { useCampaigns, useDeleteCampaign, useTerminateCampaign } from '@/lib/hooks/useCampaigns'
import { useEmailTemplates } from '@/lib/hooks/useEmailTemplates'
import { CampaignBuilder } from './CampaignBuilder'
import { CampaignDetail } from './CampaignDetail'
import { MarketingStats } from './MarketingStats'

export function MarketingContent() {
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showTerminateConfirm, setShowTerminateConfirm] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // React Query hooks
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates()
  const deleteCampaign = useDeleteCampaign()
  const terminateCampaign = useTerminateCampaign()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'sending':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Verzonden'
      case 'sending':
        return 'Bezig met verzenden'
      case 'scheduled':
        return 'Ingepland'
      case 'draft':
        return 'Concept'
      case 'paused':
        return 'Gepauzeerd'
      case 'cancelled':
        return 'Geannuleerd'
      default:
        return status
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowBuilder(true)
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    await deleteCampaign.mutateAsync(campaignId)
    setShowDeleteConfirm(null)
  }

  const handleTerminateCampaign = async (campaignId: string) => {
    await terminateCampaign.mutateAsync(campaignId)
    setShowTerminateConfirm(null)
  }

  const canDelete = (status: string) => {
    return ['draft', 'sent', 'cancelled'].includes(status)
  }

  const canTerminate = (status: string) => {
    return ['sending', 'scheduled', 'paused'].includes(status)
  }

  if (showBuilder) {
    return (
      <CampaignBuilder 
        preSelectedTemplate={selectedTemplate}
        onBack={() => {
          setShowBuilder(false)
          setSelectedTemplate(null)
        }} 
      />
    )
  }

  if (selectedCampaign) {
    return <CampaignDetail campaignId={selectedCampaign} onBack={() => setSelectedCampaign(null)} />
  }

  return (
    <div className="mobile-p space-y-6">
      {/* Marketing Stats */}
      <MarketingStats />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-mail Marketing</h1>
          <p className="text-gray-600">Beheer campagnes en sjablonen op één plek</p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/marketing/subscriptions"
            className="btn-outlined flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            E-mail Abonnees
          </a>
          <button 
            onClick={() => setShowBuilder(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Campagne
          </button>
        </div>
      </div>

      {/* Active Campaigns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Actieve Campagnes</h2>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            Alle campagnes
          </button>
        </div>

        {campaignsLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              Campagnes laden...
            </div>
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.slice(0, 9).map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCampaign(campaign.id!)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{campaign.subject_line}</p>
                  </div>
                  <div className="relative">
                    <button 
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveDropdown(activeDropdown === campaign.id ? null : campaign.id!)
                      }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {activeDropdown === campaign.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        {canTerminate(campaign.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowTerminateConfirm(campaign.id!)
                              setActiveDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Campagne Beëindigen
                          </button>
                        )}
                        {canDelete(campaign.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteConfirm(campaign.id!)
                              setActiveDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Campagne Verwijderen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
                    {getStatusText(campaign.status)}
                  </span>
                  {campaign.scheduled_at && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(campaign.scheduled_at).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{campaign.total_recipients || 0}</div>
                    <div className="text-xs text-gray-600">Ontvangers</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{campaign.total_opened || 0}</div>
                    <div className="text-xs text-gray-600">Openend</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{campaign.total_clicked || 0}</div>
                    <div className="text-xs text-gray-600">Geklikt</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen actieve campagnes</h3>
            <p className="text-gray-600 mb-4">Start met het maken van uw eerste e-mailcampagne</p>
            <button 
              onClick={() => setShowBuilder(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Maak eerste campagne
            </button>
          </div>
        )}
      </div>

      {/* Template Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Kies een Sjabloon</h2>
            <p className="text-sm text-gray-600">Selecteer een sjabloon om snel een nieuwe campagne te starten</p>
          </div>
        </div>

        {templatesLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              Sjablonen laden...
            </div>
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => {
              const categoryIcons: Record<string, string> = {
                'promotional': '🎯',
                'transactional': '📧',
                'newsletter': '📰',
                'automated': '🤖',
                'general': '✉️'
              }

              const categoryColors: Record<string, string> = {
                'promotional': 'bg-orange-100 text-orange-800',
                'transactional': 'bg-blue-100 text-blue-800',
                'newsletter': 'bg-purple-100 text-purple-800',
                'automated': 'bg-green-100 text-green-800',
                'general': 'bg-gray-100 text-gray-800'
              }

              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id!)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">{categoryIcons[template.category] || '✉️'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-700">
                        {template.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category] || 'bg-gray-100 text-gray-800'}`}>
                        {template.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {template.subject_line}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.times_used || 0}x gebruikt</span>
                    <button className="text-primary-600 hover:text-primary-700 font-medium">
                      Gebruik sjabloon →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Geen sjablonen beschikbaar</p>
            <p className="text-sm text-gray-500">
              E-mailsjablonen worden automatisch geladen voor uw salon.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Campagne Verwijderen</h3>
            <p className="text-gray-600 mb-4">
              Weet u zeker dat u deze campagne wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt. 
              Alle bijbehorende gegevens en statistieken zullen permanent worden verwijderd.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-outlined"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDeleteCampaign(showDeleteConfirm)}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Confirmation Dialog */}
      {showTerminateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTerminateConfirm(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Campagne Beëindigen</h3>
            <p className="text-gray-600 mb-4">
              Weet u zeker dat u deze campagne wilt beëindigen? Alle e-mails die nog niet verzonden zijn worden geannuleerd.
              U kunt de campagne hierna wel verwijderen als u dat wilt.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowTerminateConfirm(null)}
                className="btn-outlined"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleTerminateCampaign(showTerminateConfirm)}
                className="btn-primary bg-orange-600 hover:bg-orange-700"
              >
                Beëindigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}