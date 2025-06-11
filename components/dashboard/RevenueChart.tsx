'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const data = [
  { day: 'Ma', behandelingen: 850, producten: 320 },
  { day: 'Di', behandelingen: 720, producten: 180 },
  { day: 'Wo', behandelingen: 960, producten: 450 },
  { day: 'Do', behandelingen: 1100, producten: 280 },
  { day: 'Vr', behandelingen: 1350, producten: 520 },
  { day: 'Za', behandelingen: 1800, producten: 680 },
  { day: 'Zo', behandelingen: 450, producten: 120 },
]

export function RevenueChart() {
  const [activeTab, setActiveTab] = useState<'behandelingen' | 'producten'>('behandelingen')
  const [timePeriod, setTimePeriod] = useState('Deze week')

  const totalRevenue = data.reduce((sum, item) => sum + item.behandelingen + item.producten, 0)

  return (
    <div className="card">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-4 lg:mb-6">
        <h2 className="text-heading">Omzet overzicht</h2>
        
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          {/* Toggle Chips */}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('behandelingen')}
              className={clsx(
                'px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors flex-1 lg:flex-none',
                activeTab === 'behandelingen'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Behandelingen
            </button>
            <button
              onClick={() => setActiveTab('producten')}
              className={clsx(
                'px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors flex-1 lg:flex-none',
                activeTab === 'producten'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Producten
            </button>
          </div>

          {/* Dropdown */}
          <div className="relative">
            <button className="flex items-center justify-between w-full lg:w-auto gap-2 px-3 lg:px-4 py-2 border border-gray-300 rounded-full text-xs lg:text-sm hover:bg-gray-50 min-h-[44px]">
              <span>{timePeriod}</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 lg:h-64 mb-4 lg:mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#8D91A0' }}
            />
            <YAxis hide />
            <Bar 
              dataKey="behandelingen" 
              fill="#7091D9" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="producten" 
              fill="#E3ECFB" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Totals */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center lg:justify-start gap-4 lg:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-500 rounded"></div>
            <span className="text-xs lg:text-sm text-gray-600">Behandelingen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-100 rounded"></div>
            <span className="text-xs lg:text-sm text-gray-600">Producten</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-8 text-xs lg:text-sm text-center lg:text-left">
          <div>
            <span className="text-gray-600">Totale omzet deze week</span>
            <span className="ml-2 font-semibold">€{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="text-success">
            Prognose volgende week €9.250
          </div>
        </div>
      </div>
    </div>
  )
}