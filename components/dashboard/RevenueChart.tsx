'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useRevenueSeries } from '@/lib/hooks/useRevenueSeries'
import clsx from 'clsx'

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 (Sun) - 6 (Sat)
  const diff = (day === 0 ? -6 : 1) - day // shift so that Monday is first day
  d.setDate(d.getDate() + diff)
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

  const { data: series = [], isLoading } = useRevenueSeries(from, to)

  const MIN_BAR = 0.1 // €0,10 zodat er altijd iets is om te hoveren

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { label, omzet } = payload[0].payload as { label: string; omzet: number }
      return (
        <div className="rounded-lg bg-white shadow-lg px-3 py-2 text-xs">
          <div className="font-medium text-gray-800">{label}</div>
          <div className="text-primary-600 font-semibold">€{omzet.toLocaleString('nl-NL')}</div>
        </div>
      )
    }
    return null
  }

  const chartData = useMemo(() => {
    if (range === 'week') {
      return dayLabels.map((label, idx) => {
        const date = new Date(from)
        date.setDate(from.getDate() + idx)
        const iso = date.toISOString().slice(0, 10)
        const match = series.find((p) => p.day === iso)
        return {
          label,
          omzet: match ? Number(match.revenue) : 0,
          barOmzet: match ? Number(match.revenue) : MIN_BAR,
        }
      })
    }

    // month: build array for each day of current month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    return Array.from({ length: daysInMonth }).map((_, idx) => {
      const date = new Date(from)
      date.setDate(idx + 1)
      const iso = date.toISOString().slice(0, 10)
      const match = series.find((p) => p.day === iso)
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
      <div className="card animate-pulse">
        <div className="h-48 lg:h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-heading">Omzet overzicht</h2>
        
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
            onClick={() => setRange('week')}
              className={clsx(
              'px-3 py-1 rounded-full text-xs lg:text-sm font-medium transition-colors',
              range === 'week' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:text-gray-900'
              )}
            >
            Week
            </button>
            <button
            onClick={() => setRange('month')}
              className={clsx(
              'px-3 py-1 rounded-full text-xs lg:text-sm font-medium transition-colors',
              range === 'month' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:text-gray-900'
              )}
            >
            Maand
            </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 lg:h-64 mb-4 lg:mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#8D91A0' }}
            />
            <YAxis hide domain={[0, (dataMax: number) => (dataMax < 10 ? 10 : dataMax)]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} wrapperStyle={{ outline: 'none' }} />
            <Bar dataKey="barOmzet" fill="#7091D9" radius={[4, 4, 0, 0]} minPointSize={2} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Totals */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs lg:text-sm">
        <span className="text-gray-600">
          {range === 'week' ? 'Totale omzet deze week' : 'Totale omzet deze maand'}
        </span>
        <span className="font-semibold">€{totalRevenue.toLocaleString('nl-NL')}</span>
      </div>
    </div>
  )
}