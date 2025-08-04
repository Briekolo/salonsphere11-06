'use client'

import { useState } from 'react'
import { Calculator, Save, AlertCircle, TrendingUp } from 'lucide-react'
// import { useOverheadCosts } from '@/lib/hooks/useOverheadCosts'
import { useOverheadMetrics } from '@/lib/hooks/useOverheadCalculations'

export function OverheadSettings() {
  // Mock data for now - in real implementation would use useOverheadCosts hook
  const overheadCosts = []
  const costsLoading = false
  const updateOverheadCost = { isPending: false, mutateAsync: async () => {} }
  const { data: overheadMetrics, isLoading: metricsLoading } = useOverheadMetrics()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    rent: 0,
    utilities: 0,
    insurance: 0,
    supplies: 0,
    marketing: 0,
    other: 0
  })

  // Note: In a full implementation, this would load existing overhead costs from the database

  const handleSave = async () => {
    try {
      const updates = Object.entries(formData).map(([category, amount]) => ({
        category,
        monthly_amount: amount
      }))
      
      for (const update of updates) {
        await updateOverheadCost.mutateAsync(update)
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving overhead costs:', error)
    }
  }

  const totalMonthly = Object.values(formData).reduce((sum, cost) => sum + cost, 0)

  if (costsLoading || metricsLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Overhead Kosten</h2>
            <p className="text-sm text-gray-600">Beheer uw maandelijkse vaste kosten</p>
          </div>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={updateOverheadCost.isPending}
          className={`btn-${isEditing ? 'primary' : 'outlined'} flex items-center gap-2`}
        >
          <Save className="w-4 h-4" />
          {isEditing ? 'Opslaan' : 'Bewerken'}
        </button>
      </div>

      {/* Current Overview */}
      {overheadMetrics && !isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Per behandeling</span>
            </div>
            <p className="text-xl font-bold text-blue-900">€{overheadMetrics.overhead_per_treatment.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Percentage</span>
            </div>
            <p className="text-xl font-bold text-green-900">{overheadMetrics.overhead_percentage.toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Maandelijks</span>
            </div>
            <p className="text-xl font-bold text-purple-900">€{overheadMetrics.overhead_monthly.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Cost Categories */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-800">Kostencategorieën</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'rent', label: 'Huur', placeholder: 'Maandelijkse huur' },
            { key: 'utilities', label: 'Utilities', placeholder: 'Gas, water, licht' },
            { key: 'insurance', label: 'Verzekeringen', placeholder: 'Aansprakelijkheid, etc.' },
            { key: 'supplies', label: 'Benodigdheden', placeholder: 'Algemene benodigdheden' },
            { key: 'marketing', label: 'Marketing', placeholder: 'Advertenties, promotie' },
            { key: 'other', label: 'Overig', placeholder: 'Andere vaste kosten' }
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    [key]: parseFloat(e.target.value) || 0 
                  }))}
                  disabled={!isEditing}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : 'border-gray-300'
                  }`}
                  placeholder={placeholder}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Totaal maandelijkse overhead:</span>
            <span className="text-xl font-bold text-primary-600">€{totalMonthly.toFixed(2)}</span>
          </div>
          {overheadMetrics && (
            <p className="text-sm text-gray-600 mt-1">
              Gebaseerd op {overheadMetrics.total_treatments} behandelingen deze maand
            </p>
          )}
        </div>
      </div>

      {/* Impact Warning */}
      {isEditing && totalMonthly > (overheadMetrics?.overhead_monthly || 0) * 1.2 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Aandacht vereist</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Deze overhead kosten zijn significant hoger dan uw huidige niveau. 
            Controleer of alle bedragen correct zijn ingevoerd.
          </p>
        </div>
      )}
    </div>
  )
}