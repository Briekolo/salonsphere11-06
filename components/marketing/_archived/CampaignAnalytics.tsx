'use client'

import { useState } from 'react'
import { Download, Calendar, TrendingUp, TrendingDown, Eye, MousePointer, Users, Mail } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export function CampaignAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('opens')

  // Mock data for charts
  const performanceData = [
    { name: 'Week 1', sent: 1200, opened: 300, clicked: 45, conversions: 12 },
    { name: 'Week 2', sent: 1350, opened: 340, clicked: 52, conversions: 15 },
    { name: 'Week 3', sent: 1100, opened: 280, clicked: 38, conversions: 8 },
    { name: 'Week 4', sent: 1450, opened: 380, clicked: 65, conversions: 18 }
  ]

  const deviceData = [
    { name: 'Desktop', value: 45, color: '#7091D9' },
    { name: 'Mobiel', value: 52, color: '#ABD37A' },
    { name: 'Tablet', value: 3, color: '#A977FD' }
  ]

  const topCampaigns = [
    {
      id: '1',
      name: 'Lente Specials 2024',
      type: 'Promotie',
      sent: 1247,
      opened: 312,
      clicked: 47,
      conversions: 12,
      revenue: 1840,
      openRate: 25.0,
      clickRate: 3.8,
      conversionRate: 0.96,
      sentDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'VIP Exclusieve Aanbieding',
      type: 'VIP',
      sent: 156,
      opened: 134,
      clicked: 67,
      conversions: 23,
      revenue: 3450,
      openRate: 85.9,
      clickRate: 42.9,
      conversionRate: 14.7,
      sentDate: '2024-01-12'
    },
    {
      id: '3',
      name: 'Nieuwsbrief Maart',
      type: 'Nieuwsbrief',
      sent: 1089,
      opened: 298,
      clicked: 34,
      conversions: 8,
      revenue: 560,
      openRate: 27.4,
      clickRate: 3.1,
      conversionRate: 0.73,
      sentDate: '2024-01-10'
    },
    {
      id: '4',
      name: 'Afspraak Herinneringen',
      type: 'Automatisch',
      sent: 445,
      opened: 410,
      clicked: 89,
      conversions: 387,
      revenue: 12450,
      openRate: 92.1,
      clickRate: 20.0,
      conversionRate: 86.9,
      sentDate: '2024-01-16'
    }
  ]

  const segmentPerformance = [
    { segment: 'VIP Klanten', openRate: 78.9, clickRate: 23.4, conversionRate: 12.8 },
    { segment: 'Reguliere Klanten', openRate: 45.2, clickRate: 12.8, conversionRate: 3.2 },
    { segment: 'Nieuwe Klanten', openRate: 67.3, clickRate: 18.9, conversionRate: 8.1 },
    { segment: 'Inactieve Klanten', openRate: 28.7, clickRate: 6.2, conversionRate: 1.4 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagne Analytics</h1>
          <p className="text-gray-600">Gedetailleerde inzichten in uw e-mailmarketing prestaties</p>
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
            Rapport Exporteren
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">6,847</div>
          <div className="text-sm text-gray-600">E-mails Verzonden</div>
          <div className="text-xs text-green-600 mt-1">+12% vs vorige periode</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Eye className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">1,730</div>
          <div className="text-sm text-gray-600">Geopend</div>
          <div className="text-xs text-green-600 mt-1">25.3% open rate</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MousePointer className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">247</div>
          <div className="text-sm text-gray-600">Geklikt</div>
          <div className="text-xs text-green-600 mt-1">3.6% click rate</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">67</div>
          <div className="text-sm text-gray-600">Conversies</div>
          <div className="text-xs text-green-600 mt-1">0.98% conversie rate</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€18,300</div>
          <div className="text-sm text-gray-600">Omzet</div>
          <div className="text-xs text-green-600 mt-1">+18% vs vorige periode</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Prestatie Overzicht</h2>
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setSelectedMetric('opens')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedMetric === 'opens'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Opens
              </button>
              <button
                onClick={() => setSelectedMetric('clicks')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedMetric === 'clicks'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Clicks
              </button>
              <button
                onClick={() => setSelectedMetric('conversions')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedMetric === 'conversions'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Conversies
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric === 'opens' ? 'opened' : selectedMetric === 'clicks' ? 'clicked' : 'conversions'} 
                  stroke="#7091D9" 
                  strokeWidth={3}
                  dot={{ fill: '#7091D9', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="col-span-4 card">
          <h2 className="text-lg font-semibold mb-4">Apparaat Verdeling</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {deviceData.map((device, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: device.color }}
                  ></div>
                  <span>{device.name}</span>
                </div>
                <span className="font-medium">{device.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">Best Presterende Campagnes</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Campagne</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Verzonden</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Open Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Click Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Conversie Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Omzet</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Datum</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                      {campaign.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium">{campaign.sent.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{campaign.openRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full"
                          style={{ width: `${Math.min(campaign.openRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{campaign.clickRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${Math.min(campaign.clickRate * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{campaign.conversionRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-purple-500 h-1 rounded-full"
                          style={{ width: `${Math.min(campaign.conversionRate * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-green-600">
                      €{campaign.revenue.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {new Date(campaign.sentDate).toLocaleDateString('nl-NL')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Performance */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">Prestaties per Segment</h2>
        
        <div className="space-y-4">
          {segmentPerformance.map((segment, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{segment.segment}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Open: {segment.openRate}%</span>
                  <span className="text-gray-600">Click: {segment.clickRate}%</span>
                  <span className="text-gray-600">Conversie: {segment.conversionRate}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Open Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${segment.openRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Click Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${segment.clickRate * 3}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Conversie Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${segment.conversionRate * 7}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">🎯 Belangrijkste Inzichten</h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>• VIP klanten hebben 3x hogere conversie rates</li>
            <li>• Automatische e-mails presteren het beste (92% open rate)</li>
            <li>• Mobiele opens zijn gestegen met 15% deze maand</li>
            <li>• Dinsdag 10:00-11:00 is de beste verzendtijd</li>
          </ul>
        </div>
        
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Aanbevelingen</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Focus meer op VIP segment voor hogere ROI</li>
            <li>• Optimaliseer subject lines voor betere open rates</li>
            <li>• Implementeer meer automatische workflows</li>
            <li>• Test verschillende verzendtijden per segment</li>
          </ul>
        </div>
      </div>
    </div>
  )
}