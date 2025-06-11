import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react'

export function ClientsStats() {
  const stats = [
    {
      title: 'Totaal klanten',
      value: '247',
      change: '+12',
      changeType: 'increase' as const,
      icon: <Users className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Nieuwe klanten',
      value: '8',
      change: '+3',
      changeType: 'increase' as const,
      icon: <UserPlus className="w-5 h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Actieve klanten',
      value: '189',
      change: '+5',
      changeType: 'increase' as const,
      icon: <TrendingUp className="w-5 h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Afspraken deze week',
      value: '42',
      change: '-2',
      changeType: 'decrease' as const,
      icon: <Calendar className="w-5 h-5" />,
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