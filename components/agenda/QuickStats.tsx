'use client'

import { Calendar, Clock, Users, CheckCircle } from 'lucide-react'
import { useAgendaStats } from '@/lib/hooks/useAgendaStats'

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hrs > 0 ? `${hrs}u` : ''}${mins > 0 ? ` ${mins}m` : ''}`.trim() || '0m'
}

export function QuickStats() {
  const { countToday, totalMinutes, uniqueClients, completedCount, isLoading } = useAgendaStats()

  const stats = [
    {
      title: 'Afspraken vandaag',
      value: countToday.toString(),
      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Totale tijd',
      value: formatDuration(totalMinutes),
      icon: <Clock className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Unieke klanten',
      value: uniqueClients.toString(),
      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Afgerond',
      value: completedCount.toString(),
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
            {isLoading ? (
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="metric-value">{stat.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}