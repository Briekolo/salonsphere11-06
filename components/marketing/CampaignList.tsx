'use client'

import { useState } from 'react'
import { Plus, Mail, Users, Clock, Send, Pause, Play, Trash2, Edit, Eye, MousePointer, MoreVertical } from 'lucide-react'
import { useCampaigns, useDeleteCampaign, usePauseCampaign, useResumeCampaign } from '@/lib/hooks/useCampaigns'
import { CampaignBuilder } from './CampaignBuilder'
import { CampaignDetail } from './CampaignDetail'
import { MarketingStats } from './MarketingStats'

export function CampaignList() {
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  // React Query hooks
  const { data: campaigns, isLoading } = useCampaigns()
  const deleteCampaign = useDeleteCampaign()
  const pauseCampaign = usePauseCampaign()
  const resumeCampaign = useResumeCampaign()

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
      default:
        return status
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Weet u zeker dat u deze campagne wilt verwijderen?')) {
      await deleteCampaign.mutateAsync(id)
    }
    setShowDropdown(null)
  }

  const handlePause = async (id: string) => {
    await pauseCampaign.mutateAsync(id)
    setShowDropdown(null)
  }

  const handleResume = async (id: string) => {
    await resumeCampaign.mutateAsync(id)
    setShowDropdown(null)
  }

  if (showBuilder) {
    return <CampaignBuilder />
  }

  if (selectedCampaign) {
    return <CampaignDetail campaignId={selectedCampaign} onBack={() => setSelectedCampaign(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Marketing Stats */}
      <MarketingStats />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-mail Campagnes</h1>
          <p className="text-gray-600">Beheer en monitor uw e-mailcampagnes</p>
        </div>
        <button 
          onClick={() => setShowBuilder(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Campagne
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Alle Statussen</option>
            <option value="sent">Verzonden</option>
            <option value="sending">Bezig met verzenden</option>
            <option value="scheduled">Ingepland</option>
            <option value="draft">Concept</option>
            <option value="paused">Gepauzeerd</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Alle Types</option>
            <option value="promotional">Promotie</option>
            <option value="newsletter">Nieuwsbrief</option>
            <option value="transactional">Automatisch</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">
            {campaigns?.length || 0} campagnes gevonden
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              Campagnes laden...
            </div>
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Nog geen campagnes</h3>
            <p className="text-gray-600 mb-4">Begin met het maken van uw eerste e-mailcampagne</p>
            <button 
              onClick={() => setShowBuilder(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Eerste Campagne Maken
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Campagne</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Doelgroep</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Verzonden</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Open Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Click Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Datum</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Acties</th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <div>
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-600">{campaign.subject}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <span className={`status-chip ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {campaign.total_recipients || 0} ontvangers
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <span className="text-sm font-medium">
                        {campaign.total_sent || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {campaign.total_sent > 0 
                            ? `${((campaign.total_opened || 0) / campaign.total_sent * 100).toFixed(1)}%`
                            : '-'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <div className="flex items-center gap-2">
                        <MousePointer className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {campaign.total_sent > 0 
                            ? `${((campaign.total_clicked || 0) / campaign.total_sent * 100).toFixed(1)}%`
                            : '-'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4" onClick={() => setSelectedCampaign(campaign.id)}>
                      <span className="text-sm text-gray-600">
                        {campaign.sent_at 
                          ? new Date(campaign.sent_at).toLocaleDateString('nl-NL')
                          : campaign.scheduled_at
                          ? new Date(campaign.scheduled_at).toLocaleDateString('nl-NL')
                          : new Date(campaign.created_at).toLocaleDateString('nl-NL')
                        }
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === campaign.id ? null : campaign.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showDropdown === campaign.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign.id)
                                setShowDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Bekijken
                            </button>
                            
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => {
                                  setSelectedCampaign(campaign.id)
                                  setShowDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Bewerken
                              </button>
                            )}
                            
                            {campaign.status === 'sending' && (
                              <button
                                onClick={() => handlePause(campaign.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pause className="w-4 h-4" />
                                Pauzeren
                              </button>
                            )}
                            
                            {campaign.status === 'paused' && (
                              <button
                                onClick={() => handleResume(campaign.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Hervatten
                              </button>
                            )}
                            
                            {['draft', 'sent'].includes(campaign.status) && (
                              <button
                                onClick={() => handleDelete(campaign.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Verwijderen
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}