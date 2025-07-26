'use client'

import { Calculator, TrendingUp, TrendingDown, AlertTriangle, Euro, Calendar } from 'lucide-react'
import { useOverheadMetrics, useOverheadTrends } from '@/lib/hooks/useOverheadCalculations'

export function OverheadAnalytics() {
  const { data: metrics, isLoading } = useOverheadMetrics()
  const { data: trends, isLoading: trendsLoading } = useOverheadTrends(3)

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Overhead Analyse
          </h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Geen overhead data beschikbaar</p>
          <p className="text-sm text-gray-500 mt-1">
            Configureer uw overhead kosten in de admin instellingen
          </p>
        </div>
      </div>
    )
  }

  // Calculate trend for this month vs last month
  const currentMonth = trends?.find(t => {
    const currentDate = new Date()
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    return t.month === monthStr
  })
  
  const lastMonth = trends?.find(t => {
    const lastDate = new Date()
    lastDate.setMonth(lastDate.getMonth() - 1)
    const monthStr = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`
    return t.month === monthStr
  })

  const overheadTrend = currentMonth && lastMonth && lastMonth.overheadPerTreatment > 0
    ? ((currentMonth.overheadPerTreatment - lastMonth.overheadPerTreatment) / lastMonth.overheadPerTreatment) * 100
    : 0

  const treatmentTrend = currentMonth && lastMonth && lastMonth.totalTreatments > 0
    ? ((currentMonth.totalTreatments - lastMonth.totalTreatments) / lastMonth.totalTreatments) * 100
    : 0

  const getOverheadStatus = (percentage: number) => {
    if (percentage <= 15) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Uitstekend' }
    if (percentage <= 25) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Goed' }
    if (percentage <= 35) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Gemiddeld' }
    return { color: 'text-red-600', bg: 'bg-red-50', label: 'Hoog' }
  }

  const status = getOverheadStatus(metrics.overhead_percentage)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Overhead Analyse
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            €{metrics.overhead_per_treatment.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 mb-2">Per behandeling</div>
          {overheadTrend !== 0 && (
            <div className={`flex items-center justify-center gap-1 text-xs ${
              overheadTrend > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {overheadTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(overheadTrend).toFixed(1)}% vs vorige maand
            </div>
          )}
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {metrics.overhead_percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mb-2">Van omzet</div>
          <div className="text-xs text-gray-500">
            Gem. €{metrics.average_treatment_price.toFixed(2)} per behandeling
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Deze Maand
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-900">€{metrics.overhead_monthly.toFixed(2)}</div>
            <div className="text-blue-700">Totale overhead</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">
              {metrics.total_treatments}
              {treatmentTrend !== 0 && (
                <span className={`ml-1 text-xs ${
                  treatmentTrend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ({treatmentTrend > 0 ? '+' : ''}{treatmentTrend.toFixed(0)}%)
                </span>
              )}
            </div>
            <div className="text-blue-700">Behandelingen</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">
              €{(metrics.total_treatments * metrics.average_treatment_price).toFixed(2)}
            </div>
            <div className="text-blue-700">Geschatte omzet</div>
          </div>
        </div>
      </div>

      {/* Trends */}
      {!trendsLoading && trends && trends.length > 1 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Laatste 3 Maanden</h4>
          <div className="space-y-2">
            {trends.slice(-3).map((trend, index) => {
              const monthName = new Date(trend.month + '-01').toLocaleDateString('nl-NL', { 
                month: 'short', 
                year: 'numeric' 
              })
              
              return (
                <div key={trend.month} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="text-sm font-medium">{monthName}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {trend.totalTreatments} behandelingen
                    </span>
                    <span className="font-medium">
                      €{trend.overheadPerTreatment.toFixed(2)}
                    </span>
                    <span className="text-gray-500">
                      {trend.overheadPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">💡 Tips voor Overhead Optimalisatie</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          {metrics.overhead_percentage > 30 && (
            <li>• Overhead is hoog: evalueer vaste kosten en zoek besparingsmogelijkheden</li>
          )}
          {metrics.total_treatments < 50 && (
            <li>• Verhoog aantal behandelingen om overhead per behandeling te verlagen</li>
          )}
          {metrics.average_treatment_price < 50 && (
            <li>• Overweeg prijsverhoging of focus op duurdere behandelingen</li>
          )}
          <li>• Monitor trends maandelijks en pas strategie aan indien nodig</li>
        </ul>
      </div>
    </div>
  )
}