"use client"

import { Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ClientsFiltersProps {
  searchTerm: string
  onSearch: (value: string) => void
}

export function ClientsFilters({ searchTerm, onSearch }: ClientsFiltersProps) {
  const [localValue, setLocalValue] = useState(searchTerm)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Sync external searchTerm (e.g., when parent resets) into local state
  useEffect(() => {
    setLocalValue(searchTerm)
  }, [searchTerm])

  const handleChange = (val: string) => {
    setLocalValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(val)
    }, 400) // 400ms debounce
  }

  return (
    <div className="relative w-full lg:w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Zoek klant..."
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
      />
    </div>
  )
}