'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { KeyMetrics } from './KeyMetrics'
import { UserActivityChart } from './UserActivityChart'
import { RevenueAnalytics } from './RevenueAnalytics'
import { ConversionFunnel } from './ConversionFunnel'
import { UsagePatterns } from './UsagePatterns'
import { SystemHealth } from './SystemHealth'
import { GrowthIndicators } from './GrowthIndicators'
import { DataFilters } from './DataFilters'
import { RefreshClock } from './RefreshClock'

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedMetrics, setSelectedMetrics] = useState(['users', 'revenue', 'appointments', 'conversion'])
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every minute
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <div className="p-6 space-y-6">
      {/* Header with filters and refresh controls */}
      <DashboardHeader 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        lastUpdate={lastUpdate}
      />

      {/* Data Filters */}
      <DataFilters 
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
        dateRange={dateRange}
      />

      {/* Key Performance Metrics */}
      <KeyMetrics 
        dateRange={dateRange}
        selectedMetrics={selectedMetrics}
      />

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* User Activity Trends */}
        <div className="col-span-8">
          <UserActivityChart />
        </div>

        {/* System Health */}
        <div className="col-span-4">
          <SystemHealth />
        </div>

        {/* Revenue Analytics */}
        <div className="col-span-6">
          <RevenueAnalytics dateRange={dateRange} />
        </div>

        {/* Growth Indicators */}
        <div className="col-span-6">
          <GrowthIndicators dateRange={dateRange} />
        </div>

        {/* Conversion Funnel */}
        <div className="col-span-4">
          <ConversionFunnel dateRange={dateRange} />
        </div>

        {/* Usage Patterns */}
        <div className="col-span-8">
          <UsagePatterns dateRange={dateRange} />
        </div>
      </div>

      {/* Refresh Status */}
      <RefreshClock 
        lastUpdate={lastUpdate}
        autoRefresh={autoRefresh}
      />
    </div>
  )
}