import { Sparkles, Clock, Euro, TrendingUp } from 'lucide-react'

export function TreatmentsStats() {
  const stats = [
    {
      title: 'Totaal behandelingen',
      value: '24',
      change: '+3',
      changeType: 'increase' as const,
      icon: <Sparkles className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Gemiddelde duur',
      value: '65min',
      change: '+5min',
      changeType: 'increase' as const,
      icon: <Clock className="w-5 h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Gemiddelde prijs',
      value: '€78',
      change: '+€8',
      changeType: 'increase' as const,
      icon: <Euro className="w-5 h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Populairste behandeling',
      value: 'Pedicure',
      change: '42%',
      changeType: 'increase' as const,
      icon: <TrendingUp className="w-5 h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    }
  ]

  return (
    <div className="grid grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className="flex items-start justify-between">
            <div className={`metric-icon ${stat.iconBgColor}`}>
              <div className={stat.iconColor}>
                {stat.icon}
              </div>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stat.changeType === 'increase' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stat.change}
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