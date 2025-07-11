import { Mail, Users, TrendingUp, Calendar } from 'lucide-react'

export function MarketingStats() {
  const stats = [
    {
      title: 'Actieve campagnes',
      value: '8',
      change: '+2',
      changeType: 'increase' as const,
      icon: <Mail className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'E-mail abonnees',
      value: '1,247',
      change: '+89',
      changeType: 'increase' as const,
      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Gemiddelde open rate',
      value: '24.8%',
      change: '+2.1%',
      changeType: 'increase' as const,
      icon: <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Geplande campagnes',
      value: '5',
      change: '+1',
      changeType: 'increase' as const,
      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 mobile-gap">
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
          
          <div className="mt-3 lg:mt-4">
            <p className="metric-title">{stat.title}</p>
            <p className="metric-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}