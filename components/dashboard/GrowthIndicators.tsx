'use client'

import { TrendingUp, TrendingDown, Users, Calendar, Euro, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface GrowthIndicatorsProps {
  dateRange: string
}

export function GrowthIndicators({ dateRange }: GrowthIndicatorsProps) {
  const growthData = [
    { month: 'Aug', users: 1200, revenue: 28000, appointments: 340 },
    { month: 'Sep', users: 1350, revenue: 32000, appointments: 385 },
    { month: 'Okt', users: 1480, revenue: 35500, appointments: 420 },
    { month: 'Nov', users: 1650, revenue: 39200, appointments: 465 },
    { month: 'Dec', users: 1820, revenue: 43800, appointments: 510 },
    { month: 'Jan', users: 2100, revenue: 48400, appointments: 580 }
  ]

  const indicators = [
    {
      title: 'Gebruikersgroei',
      value: '+15.4%',
      trend: 'up',
      description: 'Maandelijkse groei',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      chartData: growthData.map(d => ({ month: d.month, value: d.users }))
    },
    {
      title: 'Omzetgroei',
      value: '+10.5%',
      trend: 'up',
      description: 'Maandelijkse groei',
      icon: <Euro className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      chartData: growthData.map(d => ({ month: d.month, value: d.revenue }))
    },
    {
      title: 'Afsprakengroei',
      value: '+13.7%',
      trend: 'up',
      description: 'Maandelijkse groei',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      chartData: growthData.map(d => ({ month: d.month, value: d.appointments }))
    },
    {
      title: 'Retentie Rate',
      value: '+2.3%',
      trend: 'up',
      description: 'Klantbehoud',
      icon: <Target className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      chartData: [
        { month: 'Aug', value: 78 },
        { month: 'Sep', value: 79 },
        { month: 'Okt', value: 81 },
        { month: 'Nov', value: 82 },
        { month: 'Dec', value: 83 },
        { month: 'Jan', value: 85 }
      ]
    }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Waarde: {payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  const calculateGrowthRate = (data: any[]) => {
    if (data.length < 2) return 0
    const latest = data[data.length - 1].value
    const previous = data[data.length - 2].value
    return ((latest - previous) / previous * 100).toFixed(1)
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Groei Indicatoren</h2>
        <p className="text-sm text-gray-600">Trends en groeipatronen over tijd</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {indicators.map((indicator, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${indicator.bgColor} rounded-lg flex items-center justify-center`}>
                  <div className={indicator.color}>
                    {indicator.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{indicator.title}</h3>
                  <p className="text-sm text-gray-600">{indicator.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`flex items-center gap-1 text-lg font-bold ${
                  indicator.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {indicator.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {indicator.value}
                </div>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={indicator.chartData}>
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={indicator.color.replace('text-', '#')} 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Growth Rate */}
            <div className="mt-2 text-center">
              <span className="text-xs text-gray-600">
                {calculateGrowthRate(indicator.chartData)}% groei vs vorige maand
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Growth Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Groei Samenvatting</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">📈</div>
            <div className="text-sm font-medium text-green-800 mt-2">Sterke Groei</div>
            <div className="text-xs text-green-700">Alle metrics positief</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">🎯</div>
            <div className="text-sm font-medium text-blue-800 mt-2">Doelen Behaald</div>
            <div className="text-xs text-blue-700">105% van target</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">🚀</div>
            <div className="text-sm font-medium text-purple-800 mt-2">Acceleratie</div>
            <div className="text-xs text-purple-700">Groei versnelt</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">💡 Groei Inzichten</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Gebruikersgroei overtreft omzetgroei - focus op conversie</li>
            <li>• Retentie rate stijgt gestaag - klanten blijven langer</li>
            <li>• Afsprakengroei is sterk - capaciteit mogelijk uitbreiden</li>
          </ul>
        </div>
      </div>
    </div>
  )
}