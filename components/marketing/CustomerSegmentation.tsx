'use client'

import { useState } from 'react'
import { Plus, Users, Filter, Edit, Trash2, Target, Calendar, Euro, Star, Mail, Upload, Download } from 'lucide-react'
import { useCustomerSegments, useCreateCustomerSegment, useDeleteCustomerSegment } from '@/lib/hooks/useCustomerSegments'
import { useEmailSubscriptions, useAddEmailSubscription, useExportSubscriptions } from '@/lib/hooks/useEmailSubscriptions'

export function CustomerSegmentation() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSegment, setNewSegment] = useState({ name: '', description: '' })
  const [showAddEmailModal, setShowAddEmailModal] = useState(false)
  const [newEmail, setNewEmail] = useState({ email: '', first_name: '', last_name: '' })
  
  // React Query hooks
  const { data: segments, isLoading } = useCustomerSegments()
  const createSegment = useCreateCustomerSegment()
  const deleteSegment = useDeleteCustomerSegment()
  
  // Email subscription hooks
  const { data: subscriptions, isLoading: subscriptionsLoading } = useEmailSubscriptions()
  const addEmailSubscription = useAddEmailSubscription()
  const exportSubscriptions = useExportSubscriptions()

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          Klanten segmenten laden...
        </div>
      </div>
    )
  }

  // Default segments if none exist
  const displaySegments = segments || []

  // Helper function to get segment color based on index
  const getSegmentColor = (index: number) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klanten</h1>
          <p className="text-gray-600">Organiseer uw klanten in gerichte groepen voor effectievere marketing</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuw Segment
        </button>
      </div>

      {/* Segment Overview */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{displaySegments.length}</div>
          <div className="text-sm text-gray-600">Actieve Segmenten</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{displaySegments.reduce((sum, seg) => sum + (seg.customer_count || 0), 0)}</div>
          <div className="text-sm text-gray-600">Totaal Klanten</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Euro className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            €{displaySegments.length > 0 
              ? Math.round(displaySegments.reduce((sum, seg) => sum + (seg.avg_spending || 0), 0) / displaySegments.length)
              : 0
            }
          </div>
          <div className="text-sm text-gray-600">Gem. Uitgave</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {displaySegments.length > 0 
              ? (displaySegments.reduce((sum, seg) => sum + (seg.open_rate || 0), 0) / displaySegments.length).toFixed(1)
              : 0
            }%
          </div>
          <div className="text-sm text-gray-600">Gem. Open Rate</div>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displaySegments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Nog geen segmenten</h3>
            <p className="text-gray-600 mb-4">Begin met het maken van klant segmenten voor gerichte marketing</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Eerste Segment Maken
            </button>
          </div>
        ) : (
          displaySegments.map((segment, index) => (
          <div key={segment.id} className="card group hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{segment.name}</h3>
                <span className={`status-chip ${getSegmentColor(index)}`}>
                  {segment.customer_count || 0} klanten
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  onClick={() => deleteSegment.mutate(segment.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{segment.description}</p>

            {/* Criteria */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Criteria:</h4>
              <ul className="space-y-1">
                {segment.criteria?.map((criterion, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    {criterion}
                  </li>
                )) || (
                  <li className="text-xs text-gray-600">Geen criteria gedefinieerd</li>
                )}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">€{segment.avg_spending || 0}</div>
                <div className="text-xs text-gray-600">Gem. Uitgave</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  (segment.growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(segment.growth_percentage || 0) >= 0 ? '+' : ''}{segment.growth_percentage || 0}%
                </div>
                <div className="text-xs text-gray-600">Groei</div>
              </div>
            </div>

            {/* Performance */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Open Rate:</span>
                <span className="font-medium">{segment.open_rate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-primary-500 h-1 rounded-full"
                  style={{ width: `${segment.open_rate || 0}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Click Rate:</span>
                <span className="font-medium">{segment.click_rate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${segment.click_rate || 0}%` }}
                />
              </div>
            </div>

            {/* Last Campaign */}
            <div className="text-xs text-gray-600 mb-4">
              Laatste campagne: {segment.last_campaign_date ? new Date(segment.last_campaign_date).toLocaleDateString('nl-NL') : 'Nog geen campagne'}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button className="flex-1 btn-primary text-sm">
                Campagne Starten
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Email Subscriptions Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">E-mail Abonnees</h2>
            <p className="text-sm text-gray-600">Beheer uw e-mail nieuwsbrief abonnees</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => exportSubscriptions.mutate()}
              className="btn-outlined flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Exporteren
            </button>
            <button 
              onClick={() => setShowAddEmailModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              E-mail Toevoegen
            </button>
          </div>
        </div>

        {/* Subscription Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {subscriptions?.filter(s => s.status === 'active').length || 0}
            </div>
            <div className="text-sm text-gray-600">Actieve Abonnees</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              +{subscriptions?.filter(s => 
                s.status === 'active' && 
                new Date(s.subscribed_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
            <div className="text-sm text-gray-600">Nieuwe (30d)</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {subscriptions?.filter(s => s.status === 'unsubscribed').length || 0}
            </div>
            <div className="text-sm text-gray-600">Uitgeschreven</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {subscriptions?.filter(s => s.status === 'bounced').length || 0}
            </div>
            <div className="text-sm text-gray-600">Bounced</div>
          </div>
        </div>

        {/* Recent Subscribers */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Recente Abonnees</h3>
          {subscriptionsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : subscriptions?.slice(0, 5).map((subscription) => (
            <div key={subscription.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{subscription.email}</div>
                  <div className="text-xs text-gray-600">
                    {subscription.first_name || subscription.last_name ? 
                      `${subscription.first_name || ''} ${subscription.last_name || ''}`.trim() : 
                      'Geen naam'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscription.status === 'unsubscribed' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {subscription.status === 'active' ? 'Actief' :
                   subscription.status === 'unsubscribed' ? 'Uitgeschreven' : 'Bounced'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(subscription.subscribed_at).toLocaleDateString('nl-NL')}
                </div>
              </div>
            </div>
          ))}
          
          {subscriptions && subscriptions.length > 5 && (
            <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 mt-3">
              Alle {subscriptions.length} abonnees bekijken →
            </button>
          )}
        </div>
      </div>

      {/* Segment Insights */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Segment Inzichten</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">VIP & Bruid</div>
            <div className="text-sm text-green-800">Hoogste conversie rates</div>
            <div className="text-xs text-green-700 mt-1">Ideaal voor premium aanbiedingen</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">Nieuwe Klanten</div>
            <div className="text-sm text-blue-800">Snelste groei segment</div>
            <div className="text-xs text-blue-700 mt-1">Focus op onboarding campagnes</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-2">Inactieve Klanten</div>
            <div className="text-sm text-orange-800">Reactivatie kansen</div>
            <div className="text-xs text-orange-700 mt-1">Win-back campagnes nodig</div>
          </div>
        </div>
      </div>

      {/* Add Email Modal */}
      {showAddEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">E-mail Abonnee Toevoegen</h2>
                <button
                  onClick={() => {
                    setShowAddEmailModal(false)
                    setNewEmail({ email: '', first_name: '', last_name: '' })
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mailadres *
                  </label>
                  <input
                    type="email"
                    value={newEmail.email}
                    onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="klant@voorbeeld.nl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voornaam
                    </label>
                    <input
                      type="text"
                      value={newEmail.first_name}
                      onChange={(e) => setNewEmail({ ...newEmail, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achternaam
                    </label>
                    <input
                      type="text"
                      value={newEmail.last_name}
                      onChange={(e) => setNewEmail({ ...newEmail, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jansen"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddEmailModal(false)
                      setNewEmail({ email: '', first_name: '', last_name: '' })
                    }}
                    className="flex-1 btn-outlined"
                  >
                    Annuleren
                  </button>
                  <button 
                    onClick={async () => {
                      if (newEmail.email) {
                        await addEmailSubscription.mutateAsync(newEmail)
                        setShowAddEmailModal(false)
                        setNewEmail({ email: '', first_name: '', last_name: '' })
                      }
                    }}
                    className="flex-1 btn-primary"
                  >
                    Toevoegen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nieuw Segment Maken</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segment Naam
                  </label>
                  <input
                    type="text"
                    type="text"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. Premium Klanten"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschrijving
                  </label>
                  <textarea
                    rows={3}
                    value={newSegment.description}
                    onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Beschrijf dit segment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Segmentatie Criteria
                  </label>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option>Totale uitgaven</option>
                        <option>Aantal bezoeken</option>
                        <option>Laatste bezoek</option>
                        <option>Gemiddelde rating</option>
                      </select>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option>Groter dan</option>
                        <option>Kleiner dan</option>
                        <option>Gelijk aan</option>
                        <option>Tussen</option>
                      </select>
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Waarde"
                      />
                    </div>
                    <button className="btn-outlined text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Criterium Toevoegen
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-outlined"
                  >
                    Annuleren
                  </button>
                  <button 
                    onClick={async () => {
                      if (newSegment.name && newSegment.description) {
                        await createSegment.mutateAsync(newSegment)
                        setShowCreateModal(false)
                        setNewSegment({ name: '', description: '' })
                      }
                    }}
                    className="flex-1 btn-primary"
                  >
                    Segment Maken
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}