'use client'

import { useState } from 'react'
import { Plus, Package, Calendar, Euro, Users, Filter, Search, Settings, BookOpen, Trash2 } from 'lucide-react'
import { useAllTreatmentSeries, useDeleteTreatmentSeries } from '@/lib/hooks/useTreatmentSeries'
import { useServices } from '@/lib/hooks/useServices'
import { CreateTreatmentSeriesModalWrapper } from './CreateTreatmentSeriesModalWrapper'

export function TreatmentSeriesManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'active' | 'templates'>('active')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()
  
  const { data: treatmentSeries = [], isLoading, refetch } = useAllTreatmentSeries()
  const deleteMutation = useDeleteTreatmentSeries()
  const { data: services = [] } = useServices()
  
  // Filter templates (services marked as series templates)
  const templates = services.filter(service => service.is_series_template)
  
  // Filter series based on search and status
  const filteredSeries = treatmentSeries.filter(series => {
    const matchesSearch = searchTerm === '' || 
      series.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || series.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Filter templates based on search
  const filteredTemplates = templates.filter(template => {
    return searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Calculate statistics from all series
  const stats = {
    total: treatmentSeries.length,
    active: treatmentSeries.filter(s => s.status === 'active').length,
    completed: treatmentSeries.filter(s => s.status === 'completed').length,
    revenue: treatmentSeries.reduce((sum, s) => sum + (s.total_price || 0), 0)
  }

  // Template statistics
  const templateStats = {
    total: templates.length,
    used: templates.filter(t => treatmentSeries.some(s => s.service_id === t.id)).length
  }

  const handleDelete = (seriesId: string) => {
    if (window.confirm('Weet je zeker dat je deze behandelreeks wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      deleteMutation.mutate(seriesId)
    }
  }

  // Helper functions for modal management
  const openCreateModal = () => {
    setSelectedTemplateId(undefined)
    setShowCreateModal(true)
  }

  const openTemplateModal = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setSelectedTemplateId(undefined)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Behandelreeksen beheren</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configureer templates en beheer actieve behandelpakketten
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'templates' ? 'Nieuwe behandelreeks vanaf template' : 'Nieuwe behandelreeks'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Actieve Reeksen
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Templates
            </div>
          </button>
        </nav>
      </div>

      {/* Statistics */}
      {activeTab === 'active' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="metric-card p-3 sm:p-4">
            <div className="metric-icon w-10 h-10 sm:w-12 sm:h-12 bg-icon-purple-bg">
              <div className="text-icon-purple">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="metric-title text-xs sm:text-sm">Totaal reeksen</p>
              <p className="metric-value text-lg sm:text-2xl">{stats.total}</p>
            </div>
          </div>
          
          <div className="metric-card p-3 sm:p-4">
            <div className="metric-icon w-10 h-10 sm:w-12 sm:h-12 bg-icon-green-bg">
              <div className="text-icon-green">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="metric-title text-xs sm:text-sm">Actieve reeksen</p>
              <p className="metric-value text-lg sm:text-2xl">{stats.active}</p>
            </div>
          </div>
          
          <div className="metric-card p-3 sm:p-4">
            <div className="metric-icon w-10 h-10 sm:w-12 sm:h-12 bg-icon-blue-bg">
              <div className="text-icon-blue">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="metric-title text-xs sm:text-sm">Voltooide reeksen</p>
              <p className="metric-value text-lg sm:text-2xl">{stats.completed}</p>
            </div>
          </div>
          
          <div className="metric-card p-3 sm:p-4">
            <div className="metric-icon w-10 h-10 sm:w-12 sm:h-12 bg-icon-orange-bg">
              <div className="text-icon-orange">
                <Euro className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="metric-title text-xs sm:text-sm">Totale omzet</p>
              <p className="metric-value text-lg sm:text-2xl">€{stats.revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="metric-card p-3 sm:p-4">
            <div className="metric-icon w-10 h-10 sm:w-12 sm:h-12 bg-icon-purple-bg">
              <div className="text-icon-purple">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="metric-title text-xs sm:text-sm">Totaal templates</p>
              <p className="metric-value text-lg sm:text-2xl">{templateStats.total}</p>
            </div>
          </div>
          
          <div className="metric-card p-3 sm:p-4">
            <div className="metric-icon w-10 h-10 sm:w-12 sm:h-12 bg-icon-green-bg">
              <div className="text-icon-green">
                <Settings className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="metric-title text-xs sm:text-sm">Gebruikt</p>
              <p className="metric-value text-lg sm:text-2xl">{templateStats.used}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'active' ? "Zoek op klant, behandeling of medewerker..." : "Zoek op naam of beschrijving..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
        
        {activeTab === 'active' && (
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
        )}
      </div>

      {/* Content */}
      {activeTab === 'active' ? (
        /* Active Treatment Series */
        isLoading ? (
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
                onClick={openCreateModal}
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
              <div key={series.id} className="bg-white rounded-lg border border-gray-200 p-4 relative group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{series.service_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {series.client_name} • {series.total_sessions} sessies
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    series.status === 'active' ? 'bg-green-100 text-green-800' :
                    series.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    series.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {series.status === 'active' ? 'Actief' : 
                     series.status === 'completed' ? 'Voltooid' :
                     series.status === 'cancelled' ? 'Geannuleerd' : 'Gepauzeerd'}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Voortgang</span>
                    <span className="text-gray-900 font-medium">
                      {series.completed_sessions || 0} van {series.total_sessions} voltooid
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        series.status === 'completed' ? 'bg-green-600' :
                        series.status === 'cancelled' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}
                      style={{ 
                        width: `${series.total_sessions > 0 ? 
                          (series.completed_sessions / series.total_sessions) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Totaalprijs</span>
                  <span className="font-medium">€{series.total_price || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Templates */
        filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Geen templates gevonden' : 'Geen behandelreeks templates'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Probeer andere zoektermen'
                : 'Markeer behandelingen als template om ze hier te zien verschijnen'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.treatment_categories?.name || template.category}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    Template
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duur:</span>
                    <span className="font-medium">{template.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prijs:</span>
                    <span className="font-medium">€{template.price}</span>
                  </div>
                  {template.treatments_needed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessies:</span>
                      <span className="font-medium">{template.treatments_needed}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openTemplateModal(template.id)}
                    className="w-full btn-outlined text-xs py-2"
                  >
                    Gebruik template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Modal */}
      <CreateTreatmentSeriesModalWrapper
        isOpen={showCreateModal}
        onClose={closeModal}
        onSuccess={() => {
          closeModal()
          refetch()
        }}
        useTemplate={activeTab === 'templates' || !!selectedTemplateId}
        preselectedTemplateId={selectedTemplateId}
      />
    </div>
  )
}