'use client'

import { useState } from 'react'
import { ArrowLeft, Mail, Eye, MousePointer, Users, Clock, TrendingUp, Calendar, Download, Trash2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useCampaign, useCampaignAnalytics, useCampaignRecipients, useDeleteCampaign, useTerminateCampaign } from '@/lib/hooks/useCampaigns'
import { useEmailMetrics } from '@/lib/hooks/useCampaignAnalytics'
import { useRouter } from 'next/navigation'

interface CampaignDetailProps {
  campaignId: string
  onBack: () => void
}

export function CampaignDetail({ campaignId, onBack }: CampaignDetailProps) {
  const router = useRouter()
  const [recipientPage, setRecipientPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false)
  
  // React Query hooks
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: analytics, isLoading: analyticsLoading } = useCampaignAnalytics(campaignId)
  const { data: recipients, isLoading: recipientsLoading } = useCampaignRecipients(campaignId, recipientPage, 10)
  const { data: metrics, isLoading: metricsLoading } = useEmailMetrics(campaignId)
  const deleteCampaign = useDeleteCampaign()
  const terminateCampaign = useTerminateCampaign()

  // Device data for pie chart
  const deviceData = [
    { name: 'Desktop', value: 45, color: '#7091D9' },
    { name: 'Mobiel', value: 52, color: '#ABD37A' },
    { name: 'Tablet', value: 3, color: '#A977FD' }
  ]

  // Performance over time data
  const performanceData = [
    { name: 'Dag 1', opened: 120, clicked: 18 },
    { name: 'Dag 2', opened: 85, clicked: 12 },
    { name: 'Dag 3', opened: 45, clicked: 8 },
    { name: 'Dag 4', opened: 30, clicked: 5 },
    { name: 'Dag 5', opened: 18, clicked: 3 },
    { name: 'Dag 6', opened: 12, clicked: 1 },
    { name: 'Dag 7', opened: 8, clicked: 1 }
  ]

  if (campaignLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          Campagne laden...
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Campagne niet gevonden</p>
        <button onClick={onBack} className="btn-primary mt-4">
          Terug naar overzicht
        </button>
      </div>
    )
  }

  const openRate = campaign.total_sent > 0 ? ((campaign.total_opened || 0) / campaign.total_sent * 100) : 0
  const clickRate = campaign.total_sent > 0 ? ((campaign.total_clicked || 0) / campaign.total_sent * 100) : 0
  const bounceRate = campaign.total_sent > 0 ? ((campaign.total_bounced || 0) / campaign.total_sent * 100) : 0

  const handleDeleteCampaign = async () => {
    await deleteCampaign.mutateAsync(campaignId)
    onBack()
  }

  const handleTerminateCampaign = async () => {
    await terminateCampaign.mutateAsync(campaignId)
    setShowTerminateConfirm(false)
  }

  const canDelete = (status: string) => {
    return ['draft', 'sent', 'cancelled'].includes(status)
  }

  const canTerminate = (status: string) => {
    return ['sending', 'scheduled', 'paused'].includes(status)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600">{campaign.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canTerminate(campaign.status) && (
            <button 
              onClick={() => setShowTerminateConfirm(true)}
              className="btn-outlined text-orange-600 border-orange-600 hover:bg-orange-50 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Beëindigen
            </button>
          )}
          {canDelete(campaign.status) && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-outlined text-red-600 border-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Verwijderen
            </button>
          )}
          <button className="btn-outlined flex items-center gap-2">
            <Download className="w-4 h-4" />
            Rapport Exporteren
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{campaign.total_sent || 0}</div>
          <div className="text-sm text-gray-600">Verzonden</div>
        </div>
        
        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Eye className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{campaign.total_opened || 0}</div>
          <div className="text-sm text-gray-600">Geopend</div>
          <div className="text-xs text-gray-500">{openRate.toFixed(1)}%</div>
        </div>
        
        <div className="card text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MousePointer className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{campaign.total_clicked || 0}</div>
          <div className="text-sm text-gray-600">Geklikt</div>
          <div className="text-xs text-gray-500">{clickRate.toFixed(1)}%</div>
        </div>
        
        <div className="card text-center">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Mail className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{campaign.total_bounced || 0}</div>
          <div className="text-sm text-gray-600">Bounced</div>
          <div className="text-xs text-gray-500">{bounceRate.toFixed(1)}%</div>
        </div>
        
        <div className="card text-center">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{campaign.total_unsubscribed || 0}</div>
          <div className="text-sm text-gray-600">Uitgeschreven</div>
        </div>
        
        <div className="card text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            €{((campaign.total_revenue || 0) / 100).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Omzet</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Performance Over Time */}
        <div className="col-span-8 card">
          <h2 className="text-lg font-semibold mb-4">Prestaties Over Tijd</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="opened" fill="#7091D9" name="Geopend" />
                <Bar dataKey="clicked" fill="#ABD37A" name="Geklikt" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="col-span-4 card">
          <h2 className="text-lg font-semibold mb-4">Apparaat Verdeling</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {deviceData.map((device, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: device.color }}
                  ></div>
                  <span>{device.name}</span>
                </div>
                <span className="font-medium">{device.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Campagne Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{campaign.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{campaign.campaign_type || 'E-mail'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sjabloon:</span>
              <span className="font-medium">{campaign.template_name || 'Aangepast'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Segment:</span>
              <span className="font-medium">{campaign.segment_name || 'Alle klanten'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verzonden op:</span>
              <span className="font-medium">
                {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString('nl-NL') : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">A/B Test Resultaten</h3>
          {campaign.ab_test_enabled ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Variant A:</span>
                <span className="font-medium">{campaign.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Variant B:</span>
                <span className="font-medium">{campaign.ab_test_subject_b}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Test grootte:</span>
                <span className="font-medium">{campaign.ab_test_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Winnaar:</span>
                <span className="font-medium text-green-600">Variant A</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Geen A/B test uitgevoerd voor deze campagne</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Recente Activiteit</h3>
        {metricsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : metrics?.events?.length ? (
          <div className="space-y-2">
            {metrics.events.slice(0, 10).map((event, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.event_type === 'opened' ? 'bg-green-500' :
                    event.event_type === 'clicked' ? 'bg-blue-500' :
                    event.event_type === 'bounced' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm">
                    {event.recipient_email} - {event.event_type}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(event.event_timestamp).toLocaleString('nl-NL')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-8">Geen recente activiteit</p>
        )}
      </div>

      {/* Recipients List */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Ontvangers</h3>
        {recipientsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : recipients?.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">E-mail</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Geopend</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Geklikt</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Verzonden op</th>
                </tr>
              </thead>
              <tbody>
                {recipients.data.map((recipient) => (
                  <tr key={recipient.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">{recipient.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        recipient.status === 'sent' ? 'bg-green-100 text-green-800' :
                        recipient.status === 'bounced' ? 'bg-red-100 text-red-800' :
                        recipient.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {recipient.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {recipient.opened_at ? new Date(recipient.opened_at).toLocaleString('nl-NL') : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {recipient.clicked_at ? new Date(recipient.clicked_at).toLocaleString('nl-NL') : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString('nl-NL') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {recipients.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setRecipientPage(Math.max(1, recipientPage - 1))}
                  disabled={recipientPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Vorige
                </button>
                <span className="text-sm text-gray-600">
                  Pagina {recipientPage} van {recipients.totalPages}
                </span>
                <button
                  onClick={() => setRecipientPage(Math.min(recipients.totalPages, recipientPage + 1))}
                  disabled={recipientPage === recipients.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Volgende
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-8">Geen ontvangers gevonden</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Campagne Verwijderen</h3>
            <p className="text-gray-600 mb-4">
              Weet u zeker dat u deze campagne wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt. 
              Alle bijbehorende gegevens en statistieken zullen permanent worden verwijderd.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outlined"
              >
                Annuleren
              </button>
              <button
                onClick={handleDeleteCampaign}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTerminateConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Campagne Beëindigen</h3>
            <p className="text-gray-600 mb-4">
              Weet u zeker dat u deze campagne wilt beëindigen? Alle e-mails die nog niet verzonden zijn worden geannuleerd.
              U kunt de campagne hierna wel verwijderen als u dat wilt.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                className="btn-outlined"
              >
                Annuleren
              </button>
              <button
                onClick={handleTerminateCampaign}
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