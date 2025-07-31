"use client"

import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ClientsFiltersProps {
  searchTerm: string
  onSearch: (value: string) => void
  isLoading?: boolean
}

export function ClientsFilters({ 
  searchTerm, 
  onSearch, 
  isLoading = false
}: ClientsFiltersProps) {
  const [localValue, setLocalValue] = useState(searchTerm)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-client-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Sync external searchTerm (e.g., when parent resets) into local state
  useEffect(() => {
    setLocalValue(searchTerm)
  }, [searchTerm])

  const saveSearch = (term: string) => {
    if (term.trim().length > 2) {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recent-client-searches', JSON.stringify(updated))
    }
  }

  const handleChange = (val: string) => {
    setLocalValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(val)
      if (val.trim()) {
        saveSearch(val.trim())
        setShowSuggestions(false)
      }
    }, 400) // 400ms debounce
  }

  const clearSearch = () => {
    setLocalValue('')
    onSearch('')
    setShowSuggestions(false)
  }

  return (
    <div className="w-full lg:w-auto">
      <div className="relative w-full lg:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
          </div>
        )}
        {localValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <input
          type="text"
          placeholder="Zoek klant..."
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowSuggestions(recentSearches.length > 0 && !localValue)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`w-full pl-10 ${localValue || isLoading ? 'pr-10' : 'pr-4'} py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]`}
        />
        
        {/* Recent searches dropdown for mobile */}
        {showSuggestions && recentSearches.length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 lg:hidden">
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2">Recente zoekopdrachten</div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setLocalValue(search)
                    onSearch(search)
                    setShowSuggestions(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded min-h-[44px] border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-gray-400" />
                    <span>{search}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
    </div>
  )
}