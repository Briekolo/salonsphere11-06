'use client'

import { Search } from 'lucide-react'

interface TreatmentsFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
}

export function TreatmentsFilters({ searchTerm, onSearchChange }: TreatmentsFiltersProps) {
  return (
    <div className="flex">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Zoek behandeling..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
        />
      </div>
    </div>
  )
}