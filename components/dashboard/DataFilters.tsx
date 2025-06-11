'use client'

import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface DataFiltersProps {
  selectedMetrics: string[]
  onMetricsChange: (metrics: string[]) => void
  dateRange: string
}

export function DataFilters({ selectedMetrics, onMetricsChange, dateRange }: DataFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const availableMetrics = [
    { id: 'users', label: 'Gebruikers', category: 'Traffic' },
    { id: 'revenue', label: 'Omzet', category: 'Business' },
    { id: 'appointments', label: 'Afspraken', category: 'Business' },
    { id: 'conversion', label: 'Conversie Rate', category: 'Performance' },
    { id: 'avgSession', label: 'Sessieduur', category: 'Engagement' },
    { id: 'satisfaction', label: 'Tevredenheid', category: 'Quality' }
  ]

  const categories = Array.from(new Set(availableMetrics.map(m => m.category)))

  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter(id => id !== metricId))
    } else {
      onMetricsChange([...selectedMetrics, metricId])
    }
  }

  const clearAllFilters = () => {
    onMetricsChange(['users', 'revenue', 'appointments', 'conversion'])
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters & Metrics
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Actieve metrics:</span>
            <span className="text-sm font-medium text-gray-900">{selectedMetrics.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Periode:</span>
          <span className="text-sm font-medium text-gray-900">
            {dateRange === '7d' && 'Laatste 7 dagen'}
            {dateRange === '30d' && 'Laatste 30 dagen'}
            {dateRange === '90d' && 'Laatste 90 dagen'}
            {dateRange === '1y' && 'Laatste jaar'}
          </span>
          
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-500 hover:text-primary-700 ml-4"
          >
            Reset filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {availableMetrics
                    .filter(metric => metric.category === category)
                    .map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => toggleMetric(metric.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedMetrics.includes(metric.id)
                            ? 'bg-primary-100 text-primary-800 border border-primary-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {metric.label}
                        {selectedMetrics.includes(metric.id) && (
                          <X className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {selectedMetrics.length} van {availableMetrics.length} metrics geselecteerd
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onMetricsChange(availableMetrics.map(m => m.id))}
                  className="text-primary-500 hover:text-primary-700"
                >
                  Alles selecteren
                </button>
                <button
                  onClick={() => onMetricsChange([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Alles deselecteren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}