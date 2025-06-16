'use client'

import { TrendingUp, TrendingDown, Users, Calendar, Euro, Package } from 'lucide-react'
import clsx from 'clsx'
import { useTenantMetrics } from '@/lib/hooks/useTenantMetrics'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  iconColor: string
  iconBgColor: string
}

function MetricCard({ title, value, change, icon, iconColor, iconBgColor }: MetricCardProps) {
  const isPositive = change > 0

  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between">
        <div className={clsx('metric-icon', iconBgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>

        {change !== 0 && (
          <div
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <div className="mt-3 lg:mt-4">
        <p className="metric-title">{title}</p>
        <p className="metric-value">{value}</p>
      </div>
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <div className="metric-card group animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg" />
      </div>
      <div className="mt-3 lg:mt-4">
        <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-1/3 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export function MetricsCards() {
  const { data: metrics, isLoading } = useTenantMetrics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 mobile-gap">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    )
  }

  const displayMetrics = metrics || {
    revenue_last30: 0,
    appointments_last30: 0,
    new_clients_last30: 0,
    low_stock_items: 0,
  }

  const cards = [
    {
      title: 'Omzet (30d)',
      value: `€${Number(displayMetrics.revenue_last30 ?? 0).toLocaleString('nl-NL')}`,
      change: 0,
      icon: <Euro className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg',
    },
    {
      title: 'Afspraken (30d)',
      value: Number(displayMetrics.appointments_last30 ?? 0).toString(),
      change: 0,
      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg',
    },
    {
      title: 'Nieuwe klanten (30d)',
      value: Number(displayMetrics.new_clients_last30 ?? 0).toString(),
      change: 0,
      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg',
    },
    {
      title: 'Voorraad laag',
      value: Number(displayMetrics.low_stock_items ?? 0).toString(),
      change: 0,
      icon: <Package className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 mobile-gap">
      {cards.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}