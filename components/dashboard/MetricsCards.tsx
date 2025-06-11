import { TrendingUp, TrendingDown, Users, Calendar, Euro, Package } from 'lucide-react'
import clsx from 'clsx'

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
        <div className={clsx(
          'metric-icon',
          iconBgColor
        )}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        
        <div className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      
      <div className="mt-3 lg:mt-4">
        <p className="metric-title">{title}</p>
        <p className="metric-value">{value}</p>
      </div>
    </div>
  )
}

export function MetricsCards() {
  const metrics = [
    {
      title: 'Afspraken vandaag',
      value: '7',
      change: 12,
      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Omzet vandaag',
      value: '€485',
      change: 8,
      icon: <Euro className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    },
    {
      title: 'Nieuwe klanten',
      value: '2',
      change: 5,
      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-purple',
      iconBgColor: 'bg-icon-purple-bg'
    },
    {
      title: 'Voorraad laag',
      value: '8',
      change: -3,
      icon: <Package className="w-4 h-4 lg:w-5 lg:h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 mobile-gap">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}