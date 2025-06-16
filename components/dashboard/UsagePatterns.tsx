'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Clock, Calendar, Smartphone, Monitor, Tablet } from 'lucide-react'

interface UsagePatternsProps {
  dateRange: string
}

export function UsagePatterns({ dateRange }: UsagePatternsProps) {
  const [activeView, setActiveView] = useState<'hourly' | 'daily' | 'device'>('hourly')

  const hourlyData = [
    { hour: '00:00', users: 45, appointments: 2 },
    { hour: '01:00', users: 32, appointments: 1 },
    { hour: '02:00', users: 28, appointments: 0 },
    { hour: '03:00', users: 25, appointments: 0 },
    { hour: '04:00', users: 30, appointments: 1 },
    { hour: '05:00', users: 42, appointments: 3 },
    { hour: '06:00', users: 68, appointments: 8 },
    { hour: '07:00', users: 95, appointments: 15 },
    { hour: '08:00', users: 142, appointments: 28 },
    { hour: '09:00', users: 189, appointments: 45 },
    { hour: '10:00', users: 234, appointments: 62 },
    { hour: '11:00', users: 198, appointments: 48 },
    { hour: '12:00', users: 156, appointments: 32 },
    { hour: '13:00', users: 178, appointments: 38 },
    { hour: '14:00', users: 203, appointments: 52 },
    { hour: '15:00', users: 187, appointments: 41 },
    { hour: '16:00', users: 165, appointments: 35 },
    { hour: '17:00', users: 142, appointments: 28 },
    { hour: '18:00', users: 118, appointments: 22 },
    { hour: '19:00', users: 95, appointments: 18 },
    { hour: '20:00', users: 78, appointments: 12 },
    { hour: '21:00', users: 62, appointments: 8 },
    { hour: '22:00', users: 48, appointments: 5 },
    { hour: '23:00', users: 38, appointments: 3 }
  ]

  const dailyData = [
    { day: 'Maandag', users: 1850, appointments: 245, color: '#7091D9' },
    { day: 'Dinsdag', users: 2100, appointments: 285, color: '#ABD37A' },
    { day: 'Woensdag', users: 1950, appointments: 265, color: '#A977FD' },
    { day: 'Donderdag', users: 2200, appointments: 295, color: '#EBB474' },
    { day: 'Vrijdag', users: 2350, appointments: 315, color: '#F87171' },
    { day: 'Zaterdag', users: 2800, appointments: 385, color: '#60A5FA' },
    { day: 'Zondag', users: 1200, appointments: 145, color: '#34D399' }
  ]

  const deviceData = [
    { device: 'Mobiel', users: 8450, percentage: 68.2, icon: <Smartphone className="w-5 h-5" />, color: '#7091D9' },
    { device: 'Desktop', users: 3240, percentage: 26.1, icon: <Monitor className="w-5 h-5" />, color: '#ABD37A' },
    { device: 'Tablet', users: 710, percentage: 5.7, icon: <Tablet className="w-5 h-5" />, color: '#A977FD' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const getPeakHours = () => {
    const sorted = [...hourlyData].sort((a, b) => b.users - a.users)
    return sorted.slice(0, 3)
  }

  const getBusiestDay = () => {
    return dailyData.reduce((max, day) => day.users > max.users ? day : max)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gebruikspatronen</h2>
          <p className="text-sm text-gray-600">Wanneer en hoe klanten uw salon gebruiken</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('hourly')}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeView === 'hourly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Per Uur
          </button>
          <button
            onClick={() => setActiveView('daily')}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeView === 'daily'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Per Dag
          </button>
          <button
            onClick={() => setActiveView('device')}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeView === 'device'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Apparaten
          </button>
        </div>
      </div>

      {activeView === 'hourly' && (
        <>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#6b7280"
                  fontSize={12}
                  interval={2}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" fill="#7091D9" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">10:00-11:00</div>
              <div className="text-sm text-blue-800">Drukste uur</div>
              <div className="text-xs text-blue-700 mt-1">234 gebruikers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">62</div>
              <div className="text-sm text-green-800">Afspraken in piekuur</div>
              <div className="text-xs text-green-700 mt-1">26.5% conversie</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">02:00-05:00</div>
              <div className="text-sm text-purple-800">Rustigste periode</div>
              <div className="text-xs text-purple-700 mt-1">Onderhoudstijd</div>
            </div>
          </div>
        </>
      )}

      {activeView === 'daily' && (
        <>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">Zaterdag</div>
              <div className="text-sm text-blue-800">Drukste dag</div>
              <div className="text-xs text-blue-700 mt-1">2,800 gebruikers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">385</div>
              <div className="text-sm text-green-800">Afspraken op zaterdag</div>
              <div className="text-xs text-green-700 mt-1">13.8% conversie</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">Zondag</div>
              <div className="text-sm text-orange-800">Rustigste dag</div>
              <div className="text-xs text-orange-700 mt-1">1,200 gebruikers</div>
            </div>
          </div>
        </>
      )}

      {activeView === 'device' && (
        <>
          <div className="space-y-4 mb-6">
            {deviceData.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white`} style={{ backgroundColor: device.color }}>
                    {device.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{device.device}</h3>
                    <p className="text-sm text-gray-600">{device.users.toLocaleString()} gebruikers</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{device.percentage}%</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${device.percentage}%`,
                        backgroundColor: device.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">68.2%</div>
              <div className="text-sm text-blue-800">Mobiel gebruik</div>
              <div className="text-xs text-blue-700 mt-1">+5.2% vs vorige periode</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">12.4%</div>
              <div className="text-sm text-green-800">Mobiele conversie</div>
              <div className="text-xs text-green-700 mt-1">Hoger dan desktop</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">8m 15s</div>
              <div className="text-sm text-purple-800">Gem. mobiele sessie</div>
              <div className="text-xs text-purple-700 mt-1">+1.2min vs desktop</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}