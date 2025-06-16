'use client'

import { Server, Database, Wifi, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export function SystemHealth() {
  const healthMetrics = [
    {
      name: 'Server Status',
      status: 'healthy',
      value: '99.9%',
      description: 'Uptime laatste 30 dagen',
      icon: <Server className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Database',
      status: 'healthy',
      value: '2.3ms',
      description: 'Gemiddelde response tijd',
      icon: <Database className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'API Performance',
      status: 'warning',
      value: '145ms',
      description: 'Gemiddelde API response',
      icon: <Wifi className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Security',
      status: 'healthy',
      value: '100%',
      description: 'Geen beveiligingsincidenten',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ]

  const recentEvents = [
    {
      id: '1',
      type: 'info',
      message: 'Database backup succesvol voltooid',
      timestamp: '2 minuten geleden',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      id: '2',
      type: 'warning',
      message: 'API response tijd verhoogd',
      timestamp: '15 minuten geleden',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />
    },
    {
      id: '3',
      type: 'info',
      message: 'Systeem update geïnstalleerd',
      timestamp: '1 uur geleden',
      icon: <CheckCircle className="w-4 h-4 text-blue-500" />
    },
    {
      id: '4',
      type: 'info',
      message: 'Beveiligingsscan voltooid',
      timestamp: '3 uren geleden',
      icon: <Shield className="w-4 h-4 text-green-500" />
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const overallHealth = healthMetrics.filter(m => m.status === 'healthy').length / healthMetrics.length * 100

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Systeemstatus</h2>
        <p className="text-sm text-gray-600">Real-time monitoring van systeem prestaties</p>
      </div>

      {/* Overall Health Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900">Algemene Status</h3>
            <p className="text-sm text-green-800">Alle systemen operationeel</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{overallHealth.toFixed(0)}%</div>
            <div className="text-sm text-green-700">Gezondheid</div>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="space-y-4 mb-6">
        {healthMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{metric.name}</h4>
                <p className="text-sm text-gray-600">{metric.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-semibold text-gray-900">{metric.value}</div>
              </div>
              {getStatusIcon(metric.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Recente Gebeurtenissen</h3>
        <div className="space-y-3">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              {event.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{event.message}</p>
                <p className="text-xs text-gray-500">{event.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Resources */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Systeembronnen</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">CPU Gebruik</span>
              <span className="font-medium">23%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Geheugen</span>
              <span className="font-medium">67%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Opslag</span>
              <span className="font-medium">45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}