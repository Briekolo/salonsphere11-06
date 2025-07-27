'use client'

import { Calendar, Clock, Users, CheckCircle, TrendingUp, XCircle } from 'lucide-react'
import { useAgendaStats } from '@/lib/hooks/useAgendaStats'
import { useTenantMetrics } from '@/lib/hooks/useTenantMetrics'

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hrs > 0 ? `${hrs}u` : ''}${mins > 0 ? ` ${mins}m` : ''}`.trim() || '0m'
}

export function AppointmentMetrics() {
  const {
    countToday = 0,
    totalMinutes = 0,
    uniqueClients = 0,
    completedCount = 0,
    confirmedCount = 0,
    cancelledCount = 0,
    isLoading: agendaLoading
  } = useAgendaStats()

  const { data: metrics, isLoading: metricsLoading } = useTenantMetrics()

  const appointmentsThisMonth = metrics?.appointments_last30 ?? 0
  const avgAppointmentsPerDay = appointmentsThisMonth > 0 ? Math.round(appointmentsThisMonth / 30) : 0

  const appointmentMetrics = [
    {
      title: 'Afspraken Vandaag',
      value: countToday,
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-icon-blue',
      bgColor: 'bg-icon-blue-bg',
      subtitle: `${completedCount} afgerond`
    },
    {
      title: 'Deze Maand',
      value: appointmentsThisMonth,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-icon-green',
      bgColor: 'bg-icon-green-bg',
      subtitle: `Ø ${avgAppointmentsPerDay} per dag`
    },
    {
      title: 'Unieke Klanten',
      value: uniqueClients,
      icon: <Users className="w-5 h-5" />,
      color: 'text-icon-purple',
      bgColor: 'bg-icon-purple-bg',
      subtitle: 'Vandaag'
    },
    {
      title: 'Totale Duur',
      value: formatDuration(totalMinutes),
      icon: <Clock className="w-5 h-5" />,
      color: 'text-icon-orange',
      bgColor: 'bg-icon-orange-bg',
      subtitle: 'Vandaag'
    },
    {
      title: 'Bevestigd',
      value: confirmedCount,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: 'Vandaag'
    },
    {
      title: 'Geannuleerd',
      value: cancelledCount,
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: 'Vandaag'
    }
  ]

  if (agendaLoading || metricsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="metric-card">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
      {appointmentMetrics.map((metric, index) => (
        <div key={`appointment-metric-${index}-${metric.title}`} className="metric-card p-3 sm:p-4 lg:p-6">
          <div className={`metric-icon ${metric.bgColor}`}>
            <div className={metric.color}>{metric.icon}</div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4">
            <p className="metric-title text-xs sm:text-sm">{metric.title}</p>
            <p className="metric-value text-lg sm:text-xl lg:text-2xl">{metric.value}</p>
            {metric.subtitle && (
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">{metric.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}