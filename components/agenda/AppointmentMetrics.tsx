'use client'

import React from 'react'
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react'
import { useAgendaStats } from '@/lib/hooks/useAgendaStats'
import { useAgendaStatsByDateRange } from '@/lib/hooks/useAgendaStatsByDateRange'
import { useTenantMetrics } from '@/lib/hooks/useTenantMetrics'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { useMemo } from 'react'

function formatDuration(minutes: number) {
  // Handle invalid inputs
  if (!minutes || minutes === 0 || isNaN(minutes)) return '0u 0m'
  
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  // Handle edge cases for better readability
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}u`
  return `${hrs}u ${mins}m`
}

interface AppointmentMetricsProps {
  viewMode: 'week' | 'month'
  currentDate: Date
}

export function AppointmentMetrics({ viewMode, currentDate }: AppointmentMetricsProps) {
  // Calculate date range based on view mode
  const { startDate, endDate, periodDays, periodLabel } = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        periodDays: 7,
        periodLabel: 'Deze Week'
      }
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        periodDays: differenceInDays(end, start) + 1,
        periodLabel: 'Deze Maand'
      }
    }
  }, [viewMode, currentDate])

  // Get today's stats for comparison
  const {
    countToday = 0,
    totalMinutes: todayMinutes = 0,
    uniqueClients: todayUniqueClients = 0,
    isLoading: todayLoading
  } = useAgendaStats()

  // Get period stats based on view mode
  const {
    countTotal: periodCount = 0,
    totalMinutes: periodMinutes = 0,
    uniqueClients: periodUniqueClients = 0,
    isLoading: periodLoading
  } = useAgendaStatsByDateRange(startDate, endDate)

  const { data: metrics, isLoading: metricsLoading } = useTenantMetrics()


  const primaryMetrics = [
    {
      title: 'Afspraken Vandaag',
      value: countToday,
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-icon-blue',
      bgColor: 'bg-icon-blue-bg'
    },
    {
      title: `Afspraken ${periodLabel}`,
      value: periodCount,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-icon-green',
      bgColor: 'bg-icon-green-bg'
    },
    {
      title: `Unieke Klanten ${periodLabel}`,
      value: periodUniqueClients,
      icon: <Users className="w-5 h-5" />,
      color: 'text-icon-purple',
      bgColor: 'bg-icon-purple-bg'
    },
    {
      title: `Totale Duur ${periodLabel}`,
      value: formatDuration(periodMinutes),
      icon: <Clock className="w-5 h-5" />,
      color: 'text-icon-orange',
      bgColor: 'bg-icon-orange-bg'
    }
  ]


  if (todayLoading || periodLoading || metricsLoading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        {/* Primary metrics loading */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
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
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {primaryMetrics.map((metric, index) => (
          <div key={`primary-metric-${index}-${metric.title}`} className="metric-card p-3 sm:p-4 lg:p-6">
            <div className={`metric-icon ${metric.bgColor}`}>
              <div className={metric.color}>{metric.icon}</div>
            </div>
            <div className="mt-2 sm:mt-3 lg:mt-4">
              <p className="metric-title text-xs sm:text-sm">{metric.title}</p>
              <p className="metric-value text-lg sm:text-xl lg:text-2xl">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}