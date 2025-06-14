'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Calendar } from 'lucide-react'
import { useBookingSeries } from '@/lib/hooks/useBookingSeries'

interface UserActivityChartProps {
  dateRange: string // wordt momenteel genegeerd; chart toont vaste periode
}

export function UserActivityChart({ dateRange: _dateRange }: UserActivityChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Bereken datumrange (laatste 14 dagen)
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 13)

  const { data: series = [], isLoading } = useBookingSeries(start, end)

  // Vul ontbrekende datums op met 0 afspraken
  const chartData = useMemo(() => {
    const days: { date: string; bookings: number }[] = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      const match = series.find((p) => p.day === iso)
      days.push({
        date: d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
        bookings: match ? Number(match.bookings) : 0,
      })
    }
    return days
  }, [series])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-primary-600">Afspraken: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-80 bg-gray-100 rounded" />
      </div>
    )
  }

  const hasData = chartData.some((d) => d.bookings > 0)
  if (!hasData) {
    return (
      <div className="card flex items-center justify-center h-64 text-gray-500">
        Geen afspraakgegevens voor deze periode
      </div>
    )
  }

  // Statistiek: verschil t.o.v. vorige dag
  const latest = chartData[chartData.length - 1]?.bookings ?? 0
  const prev = chartData[chartData.length - 2]?.bookings ?? 0
  const change = prev ? ((latest - prev) / prev) * 100 : 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-heading">Afspraken (laatste 14 dagen)</h2>
        </div>

        {/* Toggle chart type */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              chartType === 'line' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lijn
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              chartType === 'bar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Staaf
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="bookings" stroke="#7091D9" strokeWidth={3} />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" fill="#7091D9" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Samenvatting */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <div className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600" />
          <span className="text-sm">Afspraken gisteren:</span>
          <span className="font-semibold">{prev}</span>
        </div>
        <div className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(1)}% t.o.v. vorige dag
        </div>
      </div>
    </div>
  )
}