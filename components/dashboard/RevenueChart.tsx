'use client'

import { useMemo, useState } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  TooltipProps,
  Legend
} from 'recharts'
import { useRevenueData } from '@/lib/hooks/useRevenueData'
import { useExpectedRevenueData } from '@/lib/hooks/useExpectedRevenueData'
import { useScheduledAppointments } from '@/lib/hooks/useScheduledAppointments'
import { TrendingUp, TrendingDown, Euro, Eye, EyeOff, Calendar } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, addDays } from 'date-fns'
import { nl } from 'date-fns/locale'

type Period = '7d' | '30d' | '90d'

interface ChartDataPoint {
  date: string
  revenue: number
  previousRevenue?: number
  expectedRevenue?: number
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('30d')
  const [showExpected, setShowExpected] = useState(true)
  const [showAppointmentsPopup, setShowAppointmentsPopup] = useState(false)
  
  // Calculate date ranges - memoized to prevent unnecessary re-renders
  const dateRanges = useMemo(() => {
    const today = new Date()
    const endDate = endOfDay(today)
    const startDate = startOfDay(subDays(endDate, parseInt(period)))
    const previousStartDate = startOfDay(subDays(startDate, parseInt(period)))
    
    return { today, endDate, startDate, previousStartDate }
  }, [period])
  
  const { today, endDate, startDate, previousStartDate } = dateRanges
  
  const { data: revenueData = [], isLoading, error: revenueError } = useRevenueData({
    startDate,
    endDate,
    previousStartDate
  })

  const { data: expectedData = [], error: expectedError } = useExpectedRevenueData({
    startDate: today,
    endDate: addDays(today, 30) // Show expected revenue for next 30 days
  })

  const { data: scheduledAppointments = [], isLoading: appointmentsLoading } = useScheduledAppointments()
  
  console.log('[RevenueChart] Scheduled appointments:', scheduledAppointments)
  console.log('[RevenueChart] Appointments loading:', appointmentsLoading)

  // Combine revenue and expected data with validation
  const chartData = useMemo(() => {
    const dataMap = new Map<string, ChartDataPoint>()
    
    // Add actual revenue data with validation
    revenueData.forEach(item => {
      // Validate data - ensure revenue is a valid number
      const revenue = typeof item.revenue === 'number' && !isNaN(item.revenue) ? Math.max(0, item.revenue) : 0
      const previousRevenue = typeof item.previousRevenue === 'number' && !isNaN(item.previousRevenue) ? Math.max(0, item.previousRevenue) : 0
      
      dataMap.set(item.date, {
        date: item.date,
        revenue,
        previousRevenue,
        expectedRevenue: 0
      })
    })
    
    // Add expected revenue data with validation
    expectedData.forEach(item => {
      const expectedRevenue = typeof item.expectedRevenue === 'number' && !isNaN(item.expectedRevenue) ? Math.max(0, item.expectedRevenue) : 0
      const actualRevenue = typeof item.actualRevenue === 'number' && !isNaN(item.actualRevenue) ? Math.max(0, item.actualRevenue) : 0
      
      const existing = dataMap.get(item.date)
      if (existing) {
        existing.expectedRevenue = expectedRevenue
      } else {
        dataMap.set(item.date, {
          date: item.date,
          revenue: actualRevenue,
          previousRevenue: 0,
          expectedRevenue
        })
      }
    })
    
    return Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [revenueData, expectedData])

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      const selectedDate = data.date
      
      // Filter appointments for the selected date
      const appointmentsForDate = scheduledAppointments.filter(appointment => {
        const appointmentDate = format(new Date(appointment.scheduled_at), 'yyyy-MM-dd')
        return appointmentDate === selectedDate
      })
      
      return (
        <div className="bg-gray-900 text-white shadow-xl rounded-lg px-4 py-3 max-w-xs">
          <div className="text-xs opacity-80 mb-2">
            {format(new Date(data.date), 'd MMM yyyy', { locale: nl })}
          </div>
          {data.revenue > 0 && (
            <div className="mb-1">
              <span className="text-xs opacity-70">Werkelijke omzet</span>
              <div className="text-lg font-semibold">
                €{data.revenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          {showExpected && data.expectedRevenue > 0 && (
            <div className="mb-3">
              <span className="text-xs opacity-70">Verwachte omzet</span>
              <div className="text-lg font-semibold text-blue-300">
                €{data.expectedRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          
          {/* Scheduled Appointments for this date */}
          {appointmentsForDate.length > 0 && (
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex items-center gap-1 mb-2">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span className="text-xs opacity-70">Geplande afspraken</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {appointmentsForDate.map((appointment) => (
                  <div key={appointment.id} className="text-xs">
                    <div className="flex justify-between items-center">
                      <span className="truncate">
                        {appointment.clients?.first_name} {appointment.clients?.last_name}
                      </span>
                      <span className="text-green-400 ml-2">
                        €{appointment.services?.price?.toFixed(0) || '0'}
                      </span>
                    </div>
                    <div className="text-gray-400 truncate">
                      {appointment.services?.name} - {format(new Date(appointment.scheduled_at), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.revenue, 0)
    const expectedTotal = chartData.reduce((sum, item) => sum + (item.expectedRevenue || 0), 0)
    const average = chartData.filter(d => d.revenue > 0).length > 0 
      ? total / chartData.filter(d => d.revenue > 0).length 
      : 0
    const highest = Math.max(...chartData.map(d => d.revenue), 0)
    
    // Calculate previous period metrics for comparison
    const previousTotal = chartData.reduce((sum, item) => sum + (item.previousRevenue || 0), 0)
    const trend = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0
    
    return {
      total,
      expectedTotal,
      average,
      highest,
      trend,
      isPositive: trend >= 0
    }
  }, [chartData])

  // Show error state if there are errors
  if (revenueError || expectedError) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Fout bij het laden van omzetgegevens
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Er is een probleem opgetreden bij het ophalen van de omzetgegevens. 
            Controleer uw internetverbinding en probeer het opnieuw.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Probeer opnieuw
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-16 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-t from-gray-50 to-white rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">
              €{metrics.total.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            {metrics.trend !== 0 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                metrics.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {metrics.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(metrics.trend).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Omzet</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === '7d' ? '7 dagen' : p === '30d' ? '30 dagen' : '90 dagen'}
              </button>
            ))}
          </div>
          
          {/* Toggle Expected Revenue */}
          <button
            onClick={() => setShowExpected(!showExpected)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              showExpected
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showExpected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Verwachte omzet</span>
          </button>
        </div>
      </div>

      {/* Chart - Responsive height */}
      <div className="h-48 sm:h-56 lg:h-64 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: nl })}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              hide
              domain={[0, 'dataMax + 100']}
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              wrapperStyle={{ outline: 'none' }}
            />
            
            {/* Actual Revenue */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#3b82f6',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
            />
            
            {/* Expected Revenue */}
            {showExpected && (
              <Area
                type="monotone"
                dataKey="expectedRevenue"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#expectedGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#8b5cf6',
                  stroke: '#ffffff',
                  strokeWidth: 2
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="space-y-4 pt-6 mt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-xs text-gray-500">Hoogste dag</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              €{metrics.highest.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <p className="text-xs text-gray-500">Gemiddeld</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              €{metrics.average.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="relative">
            <div 
              className="cursor-pointer"
              onMouseEnter={() => setShowAppointmentsPopup(true)}
              onMouseLeave={() => setShowAppointmentsPopup(false)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Euro className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">Werkelijk totaal</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                €{metrics.total.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            
            {/* Scheduled Appointments Popup */}
            {showAppointmentsPopup && (
              <div className="absolute bottom-full mb-2 left-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Geplande Afspraken</h3>
                </div>
                
                {appointmentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : scheduledAppointments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {scheduledAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.clients?.first_name} {appointment.clients?.last_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {appointment.services?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(appointment.scheduled_at), 'd MMM HH:mm', { locale: nl })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            €{appointment.services?.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-600">Totaal verwacht:</p>
                        <p className="text-sm font-semibold text-blue-600">
                          €{scheduledAppointments.reduce((sum, apt) => sum + (apt.services?.price || 0), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    Geen geplande afspraken gevonden
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Expected Revenue Stats */}
        {showExpected && metrics.expectedTotal > 0 && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Verwachte omzet komende dagen</p>
            </div>
            <p className="text-lg font-semibold text-purple-700">
              €{metrics.expectedTotal.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}