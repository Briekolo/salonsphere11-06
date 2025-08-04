'use client'

import { AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { useOverheadMetrics } from '@/lib/hooks/useOverheadCalculations'

export function OverheadAlerts() {
  const { data: overheadMetrics, isLoading } = useOverheadMetrics()

  if (isLoading || !overheadMetrics) {
    return null
  }

  const alerts = []

  // High overhead percentage alert
  if (overheadMetrics.overhead_percentage > 30) {
    alerts.push({
      type: 'warning' as const,
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Hoge overhead kosten',
      message: `Uw overhead kosten bedragen ${overheadMetrics.overhead_percentage.toFixed(1)}% van de gemiddelde behandelprijs. Dit is hoger dan de aanbevolen 25-30%.`,
      action: 'Overweeg kostenbesparingen in huur, utilities of andere vaste kosten.'
    })
  }

  // Very high overhead per treatment alert  
  if (overheadMetrics.overhead_per_treatment > 15) {
    alerts.push({
      type: 'error' as const,
      icon: <TrendingDown className="w-5 h-5" />,
      title: 'Zeer hoge overhead per behandeling',
      message: `€${overheadMetrics.overhead_per_treatment.toFixed(2)} overhead per behandeling is extreem hoog.`,
      action: 'Verhoog het aantal behandelingen of verlaag de maandelijkse vaste kosten.'
    })
  }

  // Low treatment volume alert
  if (overheadMetrics.total_treatments < 50) {
    alerts.push({
      type: 'info' as const,
      icon: <Info className="w-5 h-5" />,
      title: 'Laag behandelvolume',
      message: `Slechts ${overheadMetrics.total_treatments} behandelingen deze maand. Meer behandelingen verlagen de overhead per behandeling.`,
      action: 'Focus op marketing en klantenwerving om het volume te verhogen.'
    })
  }

  // Good overhead ratio
  if (overheadMetrics.overhead_percentage <= 25 && overheadMetrics.overhead_per_treatment <= 8) {
    alerts.push({
      type: 'success' as const,
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Uitstekende overhead ratio',
      message: `Uw overhead van ${overheadMetrics.overhead_percentage.toFixed(1)}% ligt binnen het optimale bereik.`,
      action: 'Behoud deze goede ratio door kosten te monitoren en volume te behouden.'
    })
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${
            alert.type === 'error'
              ? 'bg-red-50 border-red-400'
              : alert.type === 'warning'
              ? 'bg-yellow-50 border-yellow-400'
              : alert.type === 'success'
              ? 'bg-green-50 border-green-400'
              : 'bg-blue-50 border-blue-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 ${
                alert.type === 'error'
                  ? 'text-red-500'
                  : alert.type === 'warning'
                  ? 'text-yellow-500'
                  : alert.type === 'success'
                  ? 'text-green-500'
                  : 'text-blue-500'
              }`}
            >
              {alert.icon}
            </div>
            <div className="flex-1">
              <h3
                className={`font-medium ${
                  alert.type === 'error'
                    ? 'text-red-800'
                    : alert.type === 'warning'
                    ? 'text-yellow-800'
                    : alert.type === 'success'
                    ? 'text-green-800'
                    : 'text-blue-800'
                }`}
              >
                {alert.title}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  alert.type === 'error'
                    ? 'text-red-700'
                    : alert.type === 'warning'
                    ? 'text-yellow-700'
                    : alert.type === 'success'
                    ? 'text-green-700'
                    : 'text-blue-700'
                }`}
              >
                {alert.message}
              </p>
              <p
                className={`text-xs mt-2 ${
                  alert.type === 'error'
                    ? 'text-red-600'
                    : alert.type === 'warning'
                    ? 'text-yellow-600'
                    : alert.type === 'success'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`}
              >
                <strong>Aanbeveling:</strong> {alert.action}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}