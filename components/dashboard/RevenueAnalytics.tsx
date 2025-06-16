'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Euro, TrendingUp, Calendar, CreditCard } from 'lucide-react'

interface RevenueAnalyticsProps {
  dateRange: string
}

export function RevenueAnalytics({ dateRange }: RevenueAnalyticsProps) {
  const [viewType, setViewType] = useState<'trend' | 'breakdown'>('trend')

  const revenueData = [
    { date: '1 Jan', revenue: 2400, treatments: 1800, products: 600 },
    { date: '2 Jan', revenue: 2800, treatments: 2100, products: 700 },
    { date: '3 Jan', revenue: 2200, treatments: 1650, products: 550 },
    { date: '4 Jan', revenue: 3200, treatments: 2400, products: 800 },
    { date: '5 Jan', revenue: 3600, treatments: 2700, products: 900 },
    { date: '6 Jan', revenue: 3100, treatments: 2325, products: 775 },
    { date: '7 Jan', revenue: 3400, treatments: 2550, products: 850 }
  ]

  const revenueBreakdown = [
    { name: 'Behandelingen', value: 18900, color: '#7091D9' },
    { name: 'Producten', value: 5250, color: '#ABD37A' },
    { name: 'Lidmaatschappen', value: 2800, color: '#A977FD' },
    { name: 'Cadeaubonnen', value: 1200, color: '#EBB474' }
  ]

  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: €{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Omzet Analytics</h2>
          <p className="text-sm text-gray-600">Gedetailleerde omzetanalyse en trends</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewType('trend')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewType === 'trend'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trend
          </button>
          <button
            onClick={() => setViewType('breakdown')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewType === 'breakdown'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verdeling
          </button>
        </div>
      </div>

      {viewType === 'trend' ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="treatments"
                stackId="1"
                stroke="#7091D9"
                fill="#7091D9"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="products"
                stackId="1"
                stroke="#ABD37A"
                fill="#ABD37A"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`, 'Omzet']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            {revenueBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">€{item.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    {((item.value / totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Summary */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Euro className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Totaal</span>
          </div>
          <div className="text-lg font-bold text-gray-900">€{totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-green-600">+18.2% vs vorige periode</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Gemiddeld/dag</span>
          </div>
          <div className="text-lg font-bold text-gray-900">€{Math.round(totalRevenue / 7).toLocaleString()}</div>
          <div className="text-xs text-blue-600">+12.5% vs vorige week</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Beste dag</span>
          </div>
          <div className="text-lg font-bold text-gray-900">€3,600</div>
          <div className="text-xs text-purple-600">5 Jan 2024</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Gem. transactie</span>
          </div>
          <div className="text-lg font-bold text-gray-900">€89</div>
          <div className="text-xs text-orange-600">+5.2% vs vorige periode</div>
        </div>
      </div>
    </div>
  )
}