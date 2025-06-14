"use client"

import { Search } from 'lucide-react'

interface ClientsFiltersProps {
  searchTerm: string
  onSearch: (value: string) => void
}

export function ClientsFilters({ searchTerm, onSearch }: ClientsFiltersProps) {
  return (
    <div className="relative w-full lg:w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Zoek klant..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
      />
    </div>
  )
}