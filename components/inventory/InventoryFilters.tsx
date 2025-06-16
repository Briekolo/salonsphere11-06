'use client'

import { Search } from 'lucide-react'

interface InventoryFiltersProps {
  searchTerm: string
  onSearch: (value: string) => void
}

export function InventoryFilters({ searchTerm, onSearch }: InventoryFiltersProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Zoek product..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[40px]"
      />
    </div>
  )
}