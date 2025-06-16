'use client'

import { Download, RefreshCw, Settings, Calendar, Filter } from 'lucide-react'

interface DashboardHeaderProps {
  dateRange: string
  onDateRangeChange: (range: string) => void
  autoRefresh: boolean
  onAutoRefreshChange: (enabled: boolean) => void
  lastUpdate: Date
}

export function DashboardHeader({ 
  dateRange, 
  onDateRangeChange, 
  autoRefresh, 
  onAutoRefreshChange,
  lastUpdate 
}: DashboardHeaderProps) {
  const dateRanges = [
    { value: '7d', label: 'Laatste 7 dagen' },
    { value: '30d', label: 'Laatste 30 dagen' },
    { value: '90d', label: 'Laatste 90 dagen' },
    { value: '1y', label: 'Laatste jaar' },
    { value: 'custom', label: 'Aangepast' }
  ]

  const handleExport = () => {
    // Export functionality
    console.log('Exporting dashboard data...')
  }

  const handleManualRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Uitgebreide inzichten in uw salon prestaties en klantgedrag
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Auto Refresh Toggle */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onAutoRefreshChange(e.target.checked)}
            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          Auto-refresh
        </label>

        {/* Manual Refresh */}
        <button
          onClick={handleManualRefresh}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Handmatig verversen"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="btn-outlined flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporteren
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}