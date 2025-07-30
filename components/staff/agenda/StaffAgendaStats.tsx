'use client'

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useStaffBookings, useStaffTodaysBookings, useStaffPermission } from '@/lib/hooks/useStaffBookings'
import { useStaffAuth } from '@/lib/hooks/useStaffAuth'
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react'

interface StaffAgendaStatsProps {
  viewMode: 'week' | 'month'
  currentDate: Date
}

export function StaffAgendaStats({ viewMode, currentDate }: StaffAgendaStatsProps) {
  const { user } = useStaffAuth()
  const { data: canViewAll } = useStaffPermission('can_view_all_appointments')

  // Get date range for current view
  const startDate = viewMode === 'week' 
    ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    : format(startOfMonth(currentDate), 'yyyy-MM-dd')
  
  const endDate = viewMode === 'week'
    ? format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    : format(endOfMonth(currentDate), 'yyyy-MM-dd')

  // Fetch data
  const { data: todaysBookings = [] } = useStaffTodaysBookings()
  const { data: periodBookings = [] } = useStaffBookings(
    canViewAll ? undefined : user?.id,
    startDate,
    endDate
  )

  // Calculate stats
  const todaysCount = todaysBookings.length
  const periodCount = periodBookings.length
  
  const todaysRevenue = todaysBookings.reduce((sum, booking) => {
    return sum + (booking.services?.price || 0)
  }, 0)

  const periodRevenue = periodBookings.reduce((sum, booking) => {
    return sum + (booking.services?.price || 0)
  }, 0)

  // Get unique clients for the period
  const uniqueClients = new Set(
    periodBookings
      .filter(booking => booking.client_id)
      .map(booking => booking.client_id)
  ).size

  // Calculate average duration
  const totalDuration = periodBookings.reduce((sum, booking) => {
    return sum + (booking.services?.duration_minutes || 0)
  }, 0)
  const avgDuration = periodCount > 0 ? Math.round(totalDuration / periodCount) : 0

  const stats = [
    {
      title: 'Vandaag',
      value: todaysCount.toString(),
      subtitle: 'afspraken',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: `Deze ${viewMode === 'week' ? 'Week' : 'Maand'}`,
      value: periodCount.toString(),
      subtitle: 'afspraken',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Omzet Vandaag',
      value: `€${todaysRevenue.toFixed(2)}`,
      subtitle: 'inkomsten',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Gemiddelde Duur',
      value: avgDuration > 0 ? `${avgDuration}min` : '0min',
      subtitle: 'per afspraak',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]

  // Add unique clients stat only if viewing all appointments
  if (canViewAll) {
    stats.push({
      title: 'Unieke Klanten',
      value: uniqueClients.toString(),
      subtitle: `deze ${viewMode === 'week' ? 'week' : 'maand'}`,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    })
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        
        return (
          <div key={index} className="metric-card">
            <div className={`metric-icon ${stat.bgColor}`}>
              <div className={stat.color}><IconComponent className="h-5 w-5" /></div>
            </div>
            <div className="mt-4">
              <p className="metric-title">{stat.title}</p>
              <p className="metric-value">{stat.value}</p>
              <p className="metric-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}