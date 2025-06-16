'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Calendar, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface InventoryReportsProps {
  onBack: () => void
}

export function InventoryReports({ onBack }: InventoryReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedReport, setSelectedReport] = useState('overview')

  // Mock data for charts
  const stockLevelData = [
    { name: 'Nagelverzorging', inStock: 45, lowStock: 8, outOfStock: 2 },
    { name: 'Huidverzorging', inStock: 32, lowStock: 3, outOfStock: 1 },
    { name: 'Haarverzorging', inStock: 28, lowStock: 2, outOfStock: 0 },
    { name: 'Gereedschap', inStock: 15, lowStock: 1, outOfStock: 1 },
    { name: 'Verbruiksartikelen', inStock: 22, lowStock: 5, outOfStock: 3 }
  ]

  const valueData = [
    { name: 'Nagelverzorging', value: 2850 },
    { name: 'Huidverzorging', value: 4200 },
    { name: 'Haarverzorging', value: 1800 },
    { name: 'Gereedschap', value: 950 },
    { name: 'Verbruiksartikelen', value: 650 }
  ]

  const usageData = [
    { month: 'Sep', usage: 1200 },
    { month: 'Okt', usage: 1450 },
    { month: 'Nov', usage: 1380 },
    { month: 'Dec', usage: 1650 },
    { month: 'Jan', usage: 1520 }
  ]

  const COLORS = ['#7091D9', '#ABD37A', '#A977FD', '#EBB474', '#F87171']

  const topProducts = [
    { name: 'OPI Base Coat', usage: 45, value: 562.50, trend: 'up' },
    { name: 'Essie Nagellak', usage: 38, value: 340.10, trend: 'up' },
    { name: 'Dermalogica Cleanser', usage: 28, value: 798.00, trend: 'down' },
    { name: 'CND Top Coat', usage: 25, value: 393.75, trend: 'up' },
    { name: 'Massage Olie', usage: 22, value: 415.80, trend: 'stable' }
  ]

  const lowStockAlerts = [
    { name: 'Essie Nagellak Rood', current: 2, min: 5, status: 'critical' },
    { name: 'Wegwerp Handdoeken', current: 1, min: 10, status: 'critical' },
    { name: 'CND Top Coat', current: 0, min: 3, status: 'out' },
    { name: 'Massage Olie Lavendel', current: 4, min: 4, status: 'low' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Voorraad Rapportages</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">Deze week</option>
            <option value="month">Deze maand</option>
            <option value="quarter">Dit kwartaal</option>
            <option value="year">Dit jaar</option>
          </select>
          <button className="btn-outlined flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporteren
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="flex bg-gray-100 rounded-full p-1">
        <button
          onClick={() => setSelectedReport('overview')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedReport === 'overview'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overzicht
        </button>
        <button
          onClick={() => setSelectedReport('usage')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedReport === 'usage'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Verbruiksanalyse
        </button>
        <button
          onClick={() => setSelectedReport('value')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedReport === 'value'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Waardeanalyse
        </button>
        <button
          onClick={() => setSelectedReport('alerts')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedReport === 'alerts'
              ? 'bg-[#02011F] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Waarschuwingen
        </button>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Stock Levels Chart */}
          <div className="col-span-8 card">
            <h2 className="text-lg font-semibold mb-4">Voorraadniveaus per categorie</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevelData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="inStock" fill="#10B981" name="Op voorraad" />
                  <Bar dataKey="lowStock" fill="#F59E0B" name="Lage voorraad" />
                  <Bar dataKey="outOfStock" fill="#EF4444" name="Uit voorraad" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Op voorraad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Lage voorraad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Uit voorraad</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-span-4 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Totaal producten</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lage voorraad</p>
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Totale waarde</p>
                  <p className="text-2xl font-bold">€11.450</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="col-span-12 card">
            <h2 className="text-lg font-semibold mb-4">Meest gebruikte producten</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Verbruik</th>
                    <th className="text-left py-2">Waarde</th>
                    <th className="text-left py-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">{product.name}</td>
                      <td className="py-3">{product.usage} stuks</td>
                      <td className="py-3">€{product.value.toFixed(2)}</td>
                      <td className="py-3">
                        {product.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {product.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {product.trend === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full"></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'usage' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Usage Trend */}
          <div className="col-span-8 card">
            <h2 className="text-lg font-semibold mb-4">Verbruikstrend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line type="monotone" dataKey="usage" stroke="#7091D9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Usage by Category */}
          <div className="col-span-4 card">
            <h2 className="text-lg font-semibold mb-4">Verbruik per categorie</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={valueData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {valueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {valueData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'value' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Value Distribution */}
          <div className="col-span-8 card">
            <h2 className="text-lg font-semibold mb-4">Voorraadwaarde per categorie</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="#7091D9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Value Summary */}
          <div className="col-span-4 space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-3">Waarde samenvatting</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Totale waarde:</span>
                  <span className="font-medium">€11.450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gemiddelde waarde:</span>
                  <span className="font-medium">€73.40</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hoogste waarde:</span>
                  <span className="font-medium">€4.200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Laagste waarde:</span>
                  <span className="font-medium">€650</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'alerts' && (
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Voorraad waarschuwingen
            </h2>
            
            <div className="space-y-3">
              {lowStockAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  alert.status === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.status === 'out' ? 'bg-red-100 border-red-300' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{alert.name}</h4>
                      <p className="text-sm text-gray-600">
                        Huidige voorraad: {alert.current} | Minimaal: {alert.min}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alert.status === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.status === 'out' ? 'bg-red-200 text-red-900' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.status === 'critical' ? 'Kritiek' :
                       alert.status === 'out' ? 'Uitverkocht' : 'Laag'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card bg-blue-50 border-blue-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">Aanbevelingen</h2>
            <ul className="space-y-2 text-blue-800">
              <li>• Plaats direct een bestelling voor uitverkochte producten</li>
              <li>• Verhoog minimale voorraadniveaus voor vaak gebruikte producten</li>
              <li>• Overweeg automatische bestellingen voor kritieke producten</li>
              <li>• Controleer leveringstijden en pas voorraadniveaus daarop aan</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}