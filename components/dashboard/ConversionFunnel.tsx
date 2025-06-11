'use client'

import { Users, Eye, MousePointer, Calendar, CheckCircle } from 'lucide-react'

interface ConversionFunnelProps {
  dateRange: string
}

export function ConversionFunnel({ dateRange }: ConversionFunnelProps) {
  const funnelData = [
    {
      stage: 'Website Bezoekers',
      count: 12450,
      percentage: 100,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      description: 'Unieke bezoekers op de website'
    },
    {
      stage: 'Behandelingen Bekeken',
      count: 8920,
      percentage: 71.6,
      icon: <Eye className="w-5 h-5" />,
      color: 'bg-green-500',
      description: 'Bezoekers die behandelingspagina\'s bekeken'
    },
    {
      stage: 'Afspraak Formulier',
      count: 3240,
      percentage: 26.0,
      icon: <MousePointer className="w-5 h-5" />,
      color: 'bg-yellow-500',
      description: 'Bezoekers die het afspraakformulier openden'
    },
    {
      stage: 'Formulier Ingevuld',
      count: 1890,
      percentage: 15.2,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-orange-500',
      description: 'Bezoekers die het formulier volledig invulden'
    },
    {
      stage: 'Afspraak Geboekt',
      count: 1234,
      percentage: 9.9,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-purple-500',
      description: 'Succesvolle afspraakboekingen'
    }
  ]

  const getDropoffRate = (currentIndex: number) => {
    if (currentIndex === 0) return null
    const current = funnelData[currentIndex]
    const previous = funnelData[currentIndex - 1]
    return ((previous.count - current.count) / previous.count * 100).toFixed(1)
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Conversie Funnel</h2>
        <p className="text-sm text-gray-600">Van bezoeker tot geboekte afspraak</p>
      </div>

      <div className="space-y-4">
        {funnelData.map((stage, index) => {
          const dropoffRate = getDropoffRate(index)
          const barWidth = stage.percentage
          
          return (
            <div key={index} className="relative">
              {/* Dropoff indicator */}
              {dropoffRate && (
                <div className="absolute -top-2 right-0 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  -{dropoffRate}% dropoff
                </div>
              )}
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 ${stage.color} rounded-lg flex items-center justify-center text-white`}>
                  {stage.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{stage.stage}</h3>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{stage.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{stage.percentage}%</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Conversie Inzichten</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">9.9%</div>
            <div className="text-sm text-green-800">Totale conversie rate</div>
            <div className="text-xs text-green-700 mt-1">+2.1% vs vorige periode</div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">58.3%</div>
            <div className="text-sm text-blue-800">Formulier completion rate</div>
            <div className="text-xs text-blue-700 mt-1">+5.4% vs vorige periode</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🎯 Optimalisatie Kansen</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• 36% dropoff bij formulier - vereenvoudig het proces</li>
            <li>• Voeg vertrouwenssignalen toe op behandelingspagina's</li>
            <li>• Test verschillende call-to-action buttons</li>
          </ul>
        </div>
      </div>
    </div>
  )
}