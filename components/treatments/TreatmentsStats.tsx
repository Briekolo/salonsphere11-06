import { Sparkles, Clock, Euro, TrendingUp } from 'lucide-react'
import { useTreatmentStats } from '@/lib/hooks/useTreatmentStats'

export function TreatmentsStats() {
 const { total = 0, avgDuration = 0, avgPrice = 0, popularName, isLoading } = useTreatmentStats()

 const stats = [
    {
      title: 'Totaal behandelingen',
      value: total.toString(),
      icon: <Sparkles className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Gemiddelde duur',
      value: avgDuration ? `${Math.round(avgDuration)}min` : '0',
      icon: <Clock className="w-5 h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Gemiddelde prijs',
      value: `€${avgPrice.toFixed(0)}`,
      icon: <Euro className="w-5 h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Populairste behandeling',
      value: popularName ?? '—',
      icon: <TrendingUp className="w-5 h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-6">
        {stats.map((_, idx) => (
          <div key={idx} className="metric-card animate-pulse">
            <div className="h-5 w-5 bg-gray-200 rounded-full mb-4" />
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className="flex items-start justify-between">
            <div className={`metric-icon ${stat.iconBgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>

          <div className="mt-4">
            <p className="metric-title">{stat.title}</p>
            <p className="metric-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}