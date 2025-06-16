'use client'

import { useState } from 'react'
import { Plus, Users, Filter, Edit, Trash2, Target, Calendar, Euro, Star } from 'lucide-react'

export function CustomerSegmentation() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const segments = [
    {
      id: '1',
      name: 'VIP Klanten',
      description: 'Klanten met hoge uitgaven en loyaliteit',
      count: 156,
      criteria: [
        'Totale uitgaven > €500',
        'Laatste bezoek < 30 dagen',
        'Gemiddelde rating > 4.5'
      ],
      growth: '+12%',
      avgSpending: 285,
      lastCampaign: '2024-01-10',
      openRate: 78.9,
      clickRate: 23.4,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: '2',
      name: 'Reguliere Klanten',
      description: 'Trouwe klanten met regelmatige bezoeken',
      count: 423,
      criteria: [
        'Aantal bezoeken > 5',
        'Laatste bezoek < 60 dagen',
        'Gemiddelde uitgave €50-200'
      ],
      growth: '+8%',
      avgSpending: 125,
      lastCampaign: '2024-01-12',
      openRate: 45.2,
      clickRate: 12.8,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: '3',
      name: 'Nieuwe Klanten',
      description: 'Klanten die zich recent hebben aangemeld',
      count: 89,
      criteria: [
        'Aangemeld < 30 dagen',
        'Aantal bezoeken ≤ 2',
        'Eerste behandeling voltooid'
      ],
      growth: '+34%',
      avgSpending: 75,
      lastCampaign: '2024-01-15',
      openRate: 67.3,
      clickRate: 18.9,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: '4',
      name: 'Inactieve Klanten',
      description: 'Klanten die lange tijd geen afspraak hebben gehad',
      count: 234,
      criteria: [
        'Laatste bezoek > 90 dagen',
        'Totale uitgaven > €100',
        'Geen recente communicatie'
      ],
      growth: '-5%',
      avgSpending: 45,
      lastCampaign: '2024-01-08',
      openRate: 28.7,
      clickRate: 6.2,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: '5',
      name: 'Seizoensklanten',
      description: 'Klanten die vooral rond feestdagen komen',
      count: 167,
      criteria: [
        'Bezoeken rond feestdagen',
        'Voorkeur voor speciale behandelingen',
        'Gemiddelde uitgave €100-300'
      ],
      growth: '+15%',
      avgSpending: 180,
      lastCampaign: '2024-01-05',
      openRate: 52.1,
      clickRate: 15.3,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: '6',
      name: 'Bruidssegment',
      description: 'Klanten die trouwgerelateerde behandelingen boeken',
      count: 45,
      criteria: [
        'Geboekte bruidspakketten',
        'Meerdere behandelingen gepland',
        'Hoge uitgaven per sessie'
      ],
      growth: '+28%',
      avgSpending: 450,
      lastCampaign: '2024-01-14',
      openRate: 89.2,
      clickRate: 34.7,
      color: 'bg-pink-100 text-pink-800'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klant Segmentatie</h1>
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
          <div className="text-2xl font-bold text-gray-900">6</div>
          <div className="text-sm text-gray-600">Actieve Segmenten</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">1,114</div>
          <div className="text-sm text-gray-600">Totaal Klanten</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Euro className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€165</div>
          <div className="text-sm text-gray-600">Gem. Uitgave</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">54.2%</div>
          <div className="text-sm text-gray-600">Gem. Open Rate</div>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <div key={segment.id} className="card group hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{segment.name}</h3>
                <span className={`status-chip ${segment.color}`}>
                  {segment.count} klanten
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
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
                {segment.criteria.map((criterion, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">€{segment.avgSpending}</div>
                <div className="text-xs text-gray-600">Gem. Uitgave</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  segment.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {segment.growth}
                </div>
                <div className="text-xs text-gray-600">Groei</div>
              </div>
            </div>

            {/* Performance */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Open Rate:</span>
                <span className="font-medium">{segment.openRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-primary-500 h-1 rounded-full"
                  style={{ width: `${segment.openRate}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Click Rate:</span>
                <span className="font-medium">{segment.clickRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${segment.clickRate}%` }}
                />
              </div>
            </div>

            {/* Last Campaign */}
            <div className="text-xs text-gray-600 mb-4">
              Laatste campagne: {new Date(segment.lastCampaign).toLocaleDateString('nl-NL')}
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
        ))}
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
                  <button className="flex-1 btn-primary">
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