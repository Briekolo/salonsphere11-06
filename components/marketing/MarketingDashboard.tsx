'use client'

import { Plus, Mail, Users, Calendar, TrendingUp, Eye, MousePointer, ShoppingBag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface MarketingDashboardProps {
  onViewChange: (view: 'dashboard' | 'campaigns' | 'templates' | 'segments' | 'analytics' | 'automation') => void
}

export function MarketingDashboard({ onViewChange }: MarketingDashboardProps) {
  // Mock data for charts
  const campaignPerformance = [
    { name: 'Jan', sent: 1200, opened: 300, clicked: 45 },
    { name: 'Feb', sent: 1350, opened: 340, clicked: 52 },
    { name: 'Mrt', sent: 1100, opened: 280, clicked: 38 },
    { name: 'Apr', sent: 1450, opened: 380, clicked: 65 },
    { name: 'Mei', sent: 1600, opened: 420, clicked: 78 }
  ]

  const segmentData = [
    { name: 'VIP Klanten', value: 156, color: '#7091D9' },
    { name: 'Reguliere Klanten', value: 423, color: '#ABD37A' },
    { name: 'Nieuwe Klanten', value: 234, color: '#A977FD' },
    { name: 'Inactieve Klanten', value: 187, color: '#EBB474' }
  ]

  const recentCampaigns = [
    {
      id: '1',
      name: 'Lente Specials 2024',
      type: 'Promotie',
      status: 'Actief',
      sent: 1247,
      opened: 312,
      clicked: 47,
      openRate: 25.0,
      clickRate: 3.8,
      sentDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Afspraak Herinnering',
      type: 'Automatisch',
      status: 'Actief',
      sent: 89,
      opened: 67,
      clicked: 23,
      openRate: 75.3,
      clickRate: 25.8,
      sentDate: '2024-01-14'
    },
    {
      id: '3',
      name: 'Nieuwsbrief Maart',
      type: 'Nieuwsbrief',
      status: 'Concept',
      sent: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
      sentDate: null
    }
  ]

  const quickActions = [
    {
      title: 'Nieuwe Campagne',
      description: 'Start een nieuwe e-mailcampagne',
      icon: <Plus className="w-6 h-6" />,
      action: () => onViewChange('campaigns'),
      color: 'bg-blue-500'
    },
    {
      title: 'Sjablonen',
      description: 'Bekijk beschikbare e-mailsjablonen',
      icon: <Mail className="w-6 h-6" />,
      action: () => onViewChange('templates'),
      color: 'bg-green-500'
    },
    {
      title: 'Segmentatie',
      description: 'Beheer klantsegmenten',
      icon: <Users className="w-6 h-6" />,
      action: () => onViewChange('segments'),
      color: 'bg-purple-500'
    },
    {
      title: 'Automatisering',
      description: 'Stel automatische workflows in',
      icon: <Calendar className="w-6 h-6" />,
      action: () => onViewChange('automation'),
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welkom bij Marketing Dashboard
            </h1>
            <p className="text-gray-600 mb-4">
              Beheer uw e-mailcampagnes, analyseer prestaties en vergroot uw klantenbereik
            </p>
            <button 
              onClick={() => onViewChange('campaigns')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Campagne Starten
            </button>
          </div>
          <div className="hidden lg:block">
            <img 
              src="https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" 
              alt="Email Marketing"
              className="w-48 h-32 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="card hover:shadow-lg transition-all duration-200 text-left group"
          >
            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Campaign Performance */}
        <div className="col-span-8 card">
          <h2 className="text-lg font-semibold mb-4">Campagne Prestaties</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformance}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="sent" fill="#E3ECFB" name="Verzonden" />
                <Bar dataKey="opened" fill="#7091D9" name="Geopend" />
                <Bar dataKey="clicked" fill="#02011F" name="Geklikt" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Verzonden</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded"></div>
              <span>Geopend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#02011F] rounded"></div>
              <span>Geklikt</span>
            </div>
          </div>
        </div>

        {/* Segment Distribution */}
        <div className="col-span-4 card">
          <h2 className="text-lg font-semibold mb-4">Klant Segmenten</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {segmentData.map((segment, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <span>{segment.name}</span>
                </div>
                <span className="font-medium">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recente Campagnes</h2>
          <button 
            onClick={() => onViewChange('analytics')}
            className="btn-outlined"
          >
            Alle Analytics Bekijken
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Campagne</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Verzonden</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Open Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Click Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Datum</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map((campaign) => (
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
                    <span className={`status-chip ${
                      campaign.status === 'Actief' ? 'bg-green-100 text-green-800' : 
                      campaign.status === 'Concept' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium">{campaign.sent.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{campaign.openRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{campaign.clickRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString('nl-NL') : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">6,847</h3>
          <p className="text-gray-600">E-mails verzonden deze maand</p>
          <div className="text-sm text-green-600 mt-2">+12% vs vorige maand</div>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">€2,340</h3>
          <p className="text-gray-600">Omzet uit e-mailmarketing</p>
          <div className="text-sm text-green-600 mt-2">+18% vs vorige maand</div>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">127</h3>
          <p className="text-gray-600">Afspraken via e-mail</p>
          <div className="text-sm text-green-600 mt-2">+8% vs vorige maand</div>
        </div>
      </div>
    </div>
  )
}