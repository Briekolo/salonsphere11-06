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
import { TrendingUp, TrendingDown, Euro, Eye, EyeOff } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, addDays } from 'date-fns'
import { nl } from 'date-fns/locale'

type Period = '7d' | '30d' | '90d' | 'future'

interface ChartDataPoint {
  date: string
  revenue: number
  previousRevenue?: number
  expectedRevenue?: number
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('30d')
  const [showExpected, setShowExpected] = useState(true)
  
  // Calculate date ranges - memoized to prevent unnecessary re-renders
  const dateRanges = useMemo(() => {
    const today = new Date()
    const endDate = period === 'future' 
      ? endOfDay(addDays(today, 30)) 
      : endOfDay(today)
    const startDate = period === 'future'
      ? startOfDay(today)
      : startOfDay(subDays(endDate, parseInt(period)))
    
    // For future period, use 30 days ago as previous start date, otherwise use parsed period
    const daysDiff = period === 'future' ? 30 : parseInt(period)
    const previousStartDate = startOfDay(subDays(startDate, daysDiff))
    
    return { today, endDate, startDate, previousStartDate }
  }, [period])
  
  const { today, endDate, startDate, previousStartDate } = dateRanges
  
  const { data: revenueData = [], isLoading } = useRevenueData({
    startDate,
    endDate,
    previousStartDate
  })

  const { data: expectedData = [] } = useExpectedRevenueData({
    startDate: period === 'future' ? startDate : today,
    endDate: period === 'future' ? endDate : addDays(endDate, 7)
  })

  // Combine revenue and expected data
  const chartData = useMemo(() => {
    const dataMap = new Map<string, ChartDataPoint>()
    
    // Add actual revenue data
    revenueData.forEach(item => {
      dataMap.set(item.date, {
        date: item.date,
        revenue: item.revenue,
        previousRevenue: item.previousRevenue,
        expectedRevenue: 0
      })
    })
    
    // Add expected revenue data
    expectedData.forEach(item => {
      const existing = dataMap.get(item.date)
      if (existing) {
        existing.expectedRevenue = item.expectedRevenue
      } else {
        dataMap.set(item.date, {
          date: item.date,
          revenue: item.actualRevenue || 0,
          previousRevenue: 0,
          expectedRevenue: item.expectedRevenue
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
      return (
        <div className="bg-gray-900 text-white shadow-xl rounded-lg px-4 py-3">
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
            <div>
              <span className="text-xs opacity-70">Verwachte omzet</span>
              <div className="text-lg font-semibold text-blue-300">
                €{data.expectedRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            {(['7d', '30d', '90d', 'future'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === '7d' ? '7 dagen' : p === '30d' ? '30 dagen' : p === '90d' ? '90 dagen' : 'Toekomst'}
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

      {/* Chart */}
      <div className="h-64 -mx-2">
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
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Euro className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-500">Werkelijk totaal</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              €{metrics.total.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
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