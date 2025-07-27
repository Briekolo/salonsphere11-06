'use client'

import { useMemo, useState } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  TooltipProps
} from 'recharts'
import { useRevenueData } from '@/lib/hooks/useRevenueData'
import { TrendingUp, TrendingDown, Euro } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { nl } from 'date-fns/locale'

type Period = '7d' | '30d' | '90d'

interface ChartDataPoint {
  date: string
  revenue: number
  previousRevenue?: number
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('30d')
  
  // Calculate date ranges
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, parseInt(period)))
  const previousStartDate = startOfDay(subDays(startDate, parseInt(period)))
  
  const { data: revenueData = [], isLoading } = useRevenueData({
    startDate,
    endDate,
    previousStartDate
  })

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      return (
        <div className="bg-gray-900 text-white shadow-xl rounded-lg px-4 py-3">
          <div className="text-xs opacity-80 mb-1">
            {format(new Date(data.date), 'd MMM', { locale: nl })}
          </div>
          <div className="text-lg font-semibold">
            €{data.revenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = revenueData.reduce((sum, item) => sum + item.revenue, 0)
    const average = revenueData.length > 0 ? total / revenueData.length : 0
    const highest = Math.max(...revenueData.map(d => d.revenue), 0)
    
    // Calculate previous period metrics for comparison
    const previousTotal = revenueData.reduce((sum, item) => sum + (item.previousRevenue || 0), 0)
    const trend = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0
    
    return {
      total,
      average,
      highest,
      trend,
      isPositive: trend >= 0
    }
  }, [revenueData])

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
      </div>

      {/* Chart */}
      <div className="h-64 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={revenueData} 
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
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
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-100">
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
            <p className="text-xs text-gray-500">Totaal</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            €{metrics.total.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  )
}