'use client'

import { useState, useEffect } from 'react'
import { Save, Calculator, TrendingUp, Euro, AlertCircle } from 'lucide-react'
import { useOverheadSettings, useUpdateOverheadSettings, useOverheadMetrics } from '@/lib/hooks/useOverheadCalculations'

export function OverheadSettings() {
  const [overheadMonthly, setOverheadMonthly] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)

  const { data: settings, isLoading } = useOverheadSettings()
  const { data: metrics } = useOverheadMetrics()
  const updateMutation = useUpdateOverheadSettings()

  useEffect(() => {
    if (settings) {
      setOverheadMonthly(settings.overhead_monthly || 0)
    }
  }, [settings])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(overheadMonthly)
      setHasChanges(false)
    } catch (error) {
      console.error('Error updating overhead settings:', error)
      alert('Fout bij opslaan van overhead instellingen')
    }
  }

  const handleOverheadChange = (value: number) => {
    setOverheadMonthly(value)
    setHasChanges(value !== (settings?.overhead_monthly || 0))
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Overhead Kosten Instellingen
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configureer uw maandelijkse overhead kosten voor nauwkeurige behandelingsprijzen
            </p>
          </div>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          )}
        </div>

        {/* Overhead Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maandelijkse Overhead Kosten (€)
          </label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={overheadMonthly}
              onChange={(e) => handleOverheadChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Voer uw maandelijkse overhead kosten in"
              min="0"
              step="0.01"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Inclusief huur, utilities, verzekeringen, administratiekosten, etc.
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Wat wordt er berekend?</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Overhead per behandeling:</strong> Maandelijkse overhead ÷ Aantal behandelingen</li>
                <li>• <strong>Overhead percentage:</strong> (Overhead per behandeling ÷ Gem. behandelingsprijs) × 100</li>
                <li>• <strong>Marge met overhead:</strong> ((Prijs - Materiaal - Overhead) ÷ Prijs) × 100</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Current Metrics */}
      {metrics && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Huidige Overhead Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                €{metrics.overhead_monthly.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Maandelijkse overhead</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.total_treatments}
              </div>
              <div className="text-sm text-gray-600">Behandelingen deze maand</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                €{metrics.overhead_per_treatment.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Overhead per behandeling</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.overhead_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overhead percentage</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <p className="font-medium">Gemiddelde behandelingsprijs: €{metrics.average_treatment_price.toFixed(2)}</p>
              <p className="text-xs mt-1">
                Gebaseerd op {metrics.total_treatments} behandelingen in {new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Richtlijnen voor Overhead Berekening</h3>
        
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Wat te includeren:</h4>
            <ul className="space-y-1 ml-4">
              <li>• Huur- en hypotheekkosten</li>
              <li>• Utilities (gas, water, licht, internet)</li>
              <li>• Verzekeringen (bedrijf, aansprakelijkheid)</li>
              <li>• Software abonnementen</li>
              <li>• Administratie en boekhoudkosten</li>
              <li>• Marketing en reclame</li>
              <li>• Schoonmaak en onderhoud</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Overhead percentage richtlijnen:</h4>
            <ul className="space-y-1 ml-4">
              <li>• <span className="text-green-600 font-medium">10-20%:</span> Efficiënte kostenstructuur</li>
              <li>• <span className="text-yellow-600 font-medium">20-30%:</span> Gemiddelde overhead</li>
              <li>• <span className="text-red-600 font-medium">>30%:</span> Hoge overhead, evalueer kosten</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}