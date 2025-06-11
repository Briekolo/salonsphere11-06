'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, Eye, MousePointer } from 'lucide-react'

interface UserActivityChartProps {
  dateRange: string
}

export function UserActivityChart({ dateRange }: UserActivityChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [activeMetric, setActiveMetric] = useState('users')

  // Mock data - in real app, this would come from API based on dateRange
  const data = [
    { date: '1 Jan', users: 1200, sessions: 1850, pageViews: 4200, bounceRate: 32 },
    { date: '2 Jan', users: 1350, sessions: 2100, pageViews: 4800, bounceRate: 28 },
    { date: '3 Jan', users: 1100, sessions: 1650, pageViews: 3900, bounceRate: 35 },
    { date: '4 Jan', users: 1450, sessions: 2250, pageViews: 5100, bounceRate: 25 },
    { date: '5 Jan', users: 1600, sessions: 2400, pageViews: 5600, bounceRate: 22 },
    { date: '6 Jan', users: 1380, sessions: 2050, pageViews: 4700, bounceRate: 30 },
    { date: '7 Jan', users: 1520, sessions: 2300, pageViews: 5200, bounceRate: 26 },
    { date: '8 Jan', users: 1750, sessions: 2650, pageViews: 6100, bounceRate: 20 },
    { date: '9 Jan', users: 1650, sessions: 2500, pageViews: 5800, bounceRate: 23 },
    { date: '10 Jan', users: 1820, sessions: 2750, pageViews: 6400, bounceRate: 18 },
    { date: '11 Jan', users: 1900, sessions: 2850, pageViews: 6700, bounceRate: 16 },
    { date: '12 Jan', users: 1780, sessions: 2680, pageViews: 6200, bounceRate: 21 },
    { date: '13 Jan', users: 1950, sessions: 2950, pageViews: 6900, bounceRate: 15 },
    { date: '14 Jan', users: 2100, sessions: 3200, pageViews: 7500, bounceRate: 12 }
  ]

  const metrics = [
    { id: 'users', label: 'Gebruikers', color: '#7091D9', icon: <Users className="w-4 h-4" /> },
    { id: 'sessions', label: 'Sessies', color: '#ABD37A', icon: <Eye className="w-4 h-4" /> },
    { id: 'pageViews', label: 'Paginaweergaven', color: '#A977FD', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'bounceRate', label: 'Bounce Rate (%)', color: '#EBB474', icon: <TrendingUp className="w-4 h-4" /> }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
              {entry.dataKey === 'bounceRate' && '%'}
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
          <h2 className="text-xl font-semibold text-gray-900">Gebruikersactiviteit</h2>
          <p className="text-sm text-gray-600">Trends in gebruikersgedrag en engagement</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Metric Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => setActiveMetric(metric.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeMetric === metric.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {metric.icon}
                {metric.label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lijn
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Staaf
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={activeMetric} 
                stroke={metrics.find(m => m.id === activeMetric)?.color || '#7091D9'}
                strokeWidth={3}
                dot={{ fill: metrics.find(m => m.id === activeMetric)?.color || '#7091D9', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: metrics.find(m => m.id === activeMetric)?.color || '#7091D9', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={activeMetric} 
                fill={metrics.find(m => m.id === activeMetric)?.color || '#7091D9'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        {metrics.map((metric) => {
          const currentValue = data[data.length - 1][metric.id as keyof typeof data[0]]
          const previousValue = data[data.length - 2][metric.id as keyof typeof data[0]]
          const change = ((Number(currentValue) - Number(previousValue)) / Number(previousValue) * 100).toFixed(1)
          
          return (
            <div key={metric.id} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div style={{ color: metric.color }}>
                  {metric.icon}
                </div>
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {Number(currentValue).toLocaleString()}
                {metric.id === 'bounceRate' && '%'}
              </div>
              <div className={`text-xs ${Number(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(change) >= 0 ? '+' : ''}{change}% vs gisteren
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}