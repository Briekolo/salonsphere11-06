'use client'

import { useState } from 'react'
import { Plus, Package, Calendar, Euro, Users, Filter, Search, Eye, Pause, Play, X } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useActiveTreatmentSeries } from '@/lib/hooks/useTreatmentSeries'
import { CreateTreatmentSeriesModal } from './CreateTreatmentSeriesModal'
import { TreatmentSeriesCard } from '../clients/TreatmentSeriesCard'

export function TreatmentSeriesManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { data: treatmentSeries = [], isLoading, refetch } = useActiveTreatmentSeries()

  // Filter series based on search and status
  const filteredSeries = treatmentSeries.filter(series => {
    const matchesSearch = searchTerm === '' || 
      series.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || series.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: treatmentSeries.length,
    active: treatmentSeries.filter(s => s.status === 'active').length,
    completed: treatmentSeries.filter(s => s.status === 'completed').length,
    revenue: treatmentSeries.reduce((sum, s) => sum + (s.total_price || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Behandelreeksen beheren</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configureer en beheer behandelpakketten met meerdere sessies
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuwe behandelreeks
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totaal reeksen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actieve reeksen</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Voltooide reeksen</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale omzet</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.revenue.toFixed(2)}</p>
            </div>
            <Euro className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op klant, behandeling of medewerker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          >
            <option value="all">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="completed">Voltooid</option>
            <option value="cancelled">Geannuleerd</option>
            <option value="paused">Gepauzeerd</option>
          </select>
        </div>
      </div>

      {/* Treatment Series List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span>Behandelreeksen laden...</span>
          </div>
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Geen behandelreeksen gevonden' 
              : 'Begin met behandelreeksen'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Probeer andere zoektermen of filters'
              : 'Maak behandelpakketten aan voor klanten die meerdere sessies nodig hebben'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Eerste behandelreeks aanmaken
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSeries.map((series) => (
            <TreatmentSeriesCard 
              key={series.id} 
              series={series} 
              onRefresh={refetch}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateTreatmentSeriesModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}