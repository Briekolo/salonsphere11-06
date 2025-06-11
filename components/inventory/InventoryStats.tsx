import { Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react'

export function InventoryStats() {
  const stats = [
    {
      title: 'Totaal producten',
      value: '156',
      change: '+8',
      changeType: 'increase' as const,
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Lage voorraad',
      value: '12',
      change: '+3',
      changeType: 'increase' as const,
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    },
    {
      title: 'Uit voorraad',
      value: '4',
      change: '+1',
      changeType: 'increase' as const,
      icon: <TrendingDown className="w-5 h-5" />,
      iconColor: 'text-red-500',
      iconBgColor: 'bg-red-100'
    },
    {
      title: 'Bestellingen deze maand',
      value: '23',
      change: '+5',
      changeType: 'increase' as const,
      icon: <ShoppingCart className="w-5 h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    }
  ]

  return (
    <div className="grid grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className="flex items-start justify-between">
            <div className={`metric-icon ${stat.iconBgColor}`}>
              <div className={stat.iconColor}>
                {stat.icon}
              </div>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stat.changeType === 'increase' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {stat.change}
            </div>
          </div>
          
          <div className="mt-4">
            <p className="metric-title">{stat.title}</p>
            <p className="metric-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}