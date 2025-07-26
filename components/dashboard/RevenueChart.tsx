'use client'

import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts'
import { useRevenueSeries } from '@/lib/hooks/useRevenueSeries'
import clsx from 'clsx'

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 (Sun) - 6 (Sat)
  // Convert Sunday (0) to 7 for easier calculation
  const adjustedDay = day === 0 ? 7 : day
  // Calculate days to subtract to get to Monday (1)
  const diff = adjustedDay - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(start: Date) {
  const d = new Date(start)
  d.setDate(start.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

const dayLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export function RevenueChart() {
  const [range, setRange] = useState<'week' | 'month'>('week')

  const today = new Date()
  const from = range === 'week' ? getStartOfWeek(today) : getStartOfMonth(today)
  const to = range === 'week' ? getEndOfWeek(from) : getEndOfMonth(today)

  console.log('Revenue Chart Debug:', {
    range,
    today: today.toISOString(),
    from: from.toISOString(),
    to: to.toISOString(),
    dayOfWeek: today.getDay()
  })

  const { data: series = [], isLoading } = useRevenueSeries(from, to)
  
  console.log('Revenue series data:', series)

  const MIN_BAR = 0.1 // €0,10 zodat er altijd iets is om te hoveren

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white shadow-lg border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600 mb-1">{label}</div>
          <div className="text-sm font-medium text-gray-900">€{data.omzet.toLocaleString('nl-NL')}</div>
        </div>
      )
    }
    return null
  }

  const chartData = useMemo(() => {
    if (range === 'week') {
      const weekData = dayLabels.map((label, idx) => {
        const date = new Date(from)
        date.setDate(from.getDate() + idx)
        const iso = date.toISOString().slice(0, 10)
        const match = series.find((p) => p.day === iso)
        console.log(`Day ${idx} (${label}):`, {
          date: date.toISOString(),
          iso,
          match,
          hasMatch: !!match
        })
        return {
          label,
          omzet: match ? Number(match.revenue) : 0,
          barOmzet: match ? Number(match.revenue) : MIN_BAR,
        }
      })
      console.log('Week chartData:', weekData)
      return weekData
    }

    // month: build array for each day of current month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    return Array.from({ length: daysInMonth }).map((_, idx) => {
      const date = new Date(today.getFullYear(), today.getMonth(), idx + 1)
      const iso = date.toISOString().slice(0, 10)
      const match = series.find((p) => p.day === iso)
      console.log(`Month day ${idx + 1}:`, {
        date: date.toISOString(),
        iso,
        match,
        hasMatch: !!match
      })
      return {
        label: date.getDate().toString(),
        omzet: match ? Number(match.revenue) : 0,
        barOmzet: match ? Number(match.revenue) : MIN_BAR,
      }
    })
  }, [series, from, range])

  const totalRevenue = chartData.reduce((sum, item) => sum + item.omzet, 0)

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-80 bg-gradient-to-t from-gray-100 to-gray-50 rounded-xl"></div>
      </div>
    )
  }

  const maxValue = Math.max(...chartData.map(d => d.omzet))
  const avgValue = chartData.reduce((sum, d) => sum + d.omzet, 0) / chartData.length

  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-2">
              Omzet overzicht
            </h2>
            <p className="text-sm text-gray-600">Totaal €{totalRevenue.toLocaleString('nl-NL')}</p>
          </div>
          
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setRange('week')}
              className={clsx(
                'px-6 py-2 text-sm font-medium transition-all',
                range === 'week' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setRange('month')}
              className={clsx(
                'px-6 py-2 text-sm font-medium transition-all border-l border-gray-200',
                range === 'month' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              Maand
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 400 }}
                dy={10}
                interval={0}
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 400 }}
                tickFormatter={(value) => `€${value}`}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                wrapperStyle={{ outline: 'none' }}
              />
              
              <Area
                type="monotone"
                dataKey="omzet"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#10b981',
                  stroke: '#ffffff',
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Simple stats */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900 mb-1">€{Math.round(maxValue)}</div>
            <div className="text-sm text-gray-500">Hoogste dag</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900 mb-1">€{Math.round(avgValue)}</div>
            <div className="text-sm text-gray-500">Gemiddeld</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-emerald-600 mb-1">+{((totalRevenue / (avgValue * chartData.length) - 1) * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-500">vs vorige periode</div>
          </div>
        </div>
      </div>
    </div>
  )
}