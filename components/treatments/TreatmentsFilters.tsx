'use client'

import { useState } from 'react'
import { Search, Filter, ChevronDown } from 'lucide-react'

export function TreatmentsFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')

  return (
    <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
      {/* Search */}
      <div className="relative flex-1 lg:flex-none lg:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Zoek behandeling..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
        />
      </div>

      <div className="grid grid-cols-2 lg:flex lg:items-center gap-3 lg:gap-4">
        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full"
          >
            <option value="all">Alle categorieën</option>
            <option value="nails">Nagelverzorging</option>
            <option value="facial">Gezichtsbehandelingen</option>
            <option value="body">Lichaamsbehandelingen</option>
            <option value="massage">Massage</option>
            <option value="waxing">Ontharing</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Price Range */}
        <div className="relative">
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] w-full"
          >
            <option value="all">Alle prijzen</option>
            <option value="0-50">€0 - €50</option>
            <option value="50-100">€50 - €100</option>
            <option value="100-150">€100 - €150</option>
            <option value="150+">€150+</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Duration Filter - Hidden on mobile */}
        <div className="relative hidden lg:block">
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
          >
            <option value="all">Alle duur</option>
            <option value="0-30">0-30 min</option>
            <option value="30-60">30-60 min</option>
            <option value="60-90">60-90 min</option>
            <option value="90+">90+ min</option>
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