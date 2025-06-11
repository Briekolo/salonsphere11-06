'use client'

import { TrendingUp, TrendingDown, Users, Calendar, Euro, Target, Clock, Star } from 'lucide-react'
import { useState } from 'react'

interface KeyMetricsProps {
  dateRange: string
  selectedMetrics: string[]
}

export function KeyMetrics({ dateRange, selectedMetrics }: KeyMetricsProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)

  const metrics = [
    {
      id: 'users',
      title: 'Totaal Gebruikers',
      value: '2,847',
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: <Users className="w-6 h-6" />,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      description: 'Actieve gebruikers in de geselecteerde periode',
      details: {
        daily: '94',
        weekly: '658',
        monthly: '2,847'
      }
    },
    {
      id: 'revenue',
      title: 'Totale Omzet',
      value: '€48,392',
      change: '+18.2%',
      changeType: 'increase' as const,
      icon: <Euro className="w-6 h-6" />,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      description: 'Totale omzet uit alle behandelingen',
      details: {
        daily: '€1,613',
        weekly: '€11,291',
        monthly: '€48,392'
      }
    },
    {
      id: 'appointments',
      title: 'Afspraken',
      value: '1,234',
      change: '+8.7%',
      changeType: 'increase' as const,
      icon: <Calendar className="w-6 h-6" />,
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
      description: 'Totaal aantal geboekte afspraken',
      details: {
        daily: '41',
        weekly: '287',
        monthly: '1,234'
      }
    },
    {
      id: 'conversion',
      title: 'Conversie Rate',
      value: '24.8%',
      change: '+3.1%',
      changeType: 'increase' as const,
      icon: <Target className="w-6 h-6" />,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
      description: 'Percentage bezoekers dat een afspraak boekt',
      details: {
        daily: '26.2%',
        weekly: '25.1%',
        monthly: '24.8%'
      }
    },
    {
      id: 'avgSession',
      title: 'Gem. Sessieduur',
      value: '8m 42s',
      change: '+1.3%',
      changeType: 'increase' as const,
      icon: <Clock className="w-6 h-6" />,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-100',
      description: 'Gemiddelde tijd besteed op de website',
      details: {
        daily: '9m 15s',
        weekly: '8m 58s',
        monthly: '8m 42s'
      }
    },
    {
      id: 'satisfaction',
      title: 'Klanttevredenheid',
      value: '4.8/5',
      change: '+0.2',
      changeType: 'increase' as const,
      icon: <Star className="w-6 h-6" />,
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-yellow-100',
      description: 'Gemiddelde beoordeling van klanten',
      details: {
        daily: '4.9/5',
        weekly: '4.8/5',
        monthly: '4.8/5'
      }
    }
  ]

  const filteredMetrics = metrics.filter(metric => selectedMetrics.includes(metric.id))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {filteredMetrics.map((metric) => (
        <div 
          key={metric.id} 
          className="card group hover:shadow-lg transition-all duration-200 cursor-pointer relative"
          onMouseEnter={() => setHoveredMetric(metric.id)}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${metric.iconBgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <div className={metric.iconColor}>
                {metric.icon}
              </div>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              metric.changeType === 'increase' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {metric.changeType === 'increase' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {metric.change}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>

          {/* Tooltip */}
          {hoveredMetric === metric.id && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
              <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dagelijks:</span>
                  <span className="font-medium">{metric.details.daily}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wekelijks:</span>
                  <span className="font-medium">{metric.details.weekly}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Maandelijks:</span>
                  <span className="font-medium">{metric.details.monthly}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}