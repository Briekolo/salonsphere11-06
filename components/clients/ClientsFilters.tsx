'use client'

import { useState } from 'react'
import { Search, Filter, ChevronDown, Calendar } from 'lucide-react'

export function ClientsFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  return (
    <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
      {/* Search */}
      <div className="relative flex-1 lg:flex-none lg:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Zoek klant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
        />
      </div>

      <div className="grid grid-cols-2 lg:flex lg:items-center gap-3 lg:gap-4">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full"
          >
            <option value="all">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="inactive">Inactief</option>
            <option value="vip">VIP</option>
            <option value="new">Nieuw</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Segment Filter */}
        <div className="relative">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full"
          >
            <option value="all">Alle segmenten</option>
            <option value="regular">Regulier</option>
            <option value="premium">Premium</option>
            <option value="occasional">Incidenteel</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Date Range - Hidden on mobile */}
        <div className="relative hidden lg:block">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
          >
            <option value="all">Alle periodes</option>
            <option value="week">Deze week</option>
            <option value="month">Deze maand</option>
            <option value="quarter">Dit kwartaal</option>
            <option value="year">Dit jaar</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors min-h-[44px] col-span-2 lg:col-span-1">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Meer filters</span>
        </button>
      </div>
    </div>
  )
}