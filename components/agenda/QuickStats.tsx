import { Calendar, Clock, Users, CheckCircle } from 'lucide-react'

export function QuickStats() {
  const stats = [
    {
      title: 'Afspraken vandaag',
      value: '12',
      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Totale tijd',
      value: '8.5u',
      icon: <Clock className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Unieke klanten',
      value: '9',
      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Afgerond',
      value: '7',
      icon: <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 mobile-gap">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className={`metric-icon ${stat.iconBgColor}`}>
            <div className={stat.iconColor}>
              {stat.icon}
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