'use client'

import { Calendar, Filter, ChevronLeft, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface CalendarHeaderProps {
  currentMonth: string
  viewDuration: '1week' | '2weeks' | '1month'
  onViewDurationChange: (duration: '1week' | '2weeks' | '1month') => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  filterType: 'all' | 'confirmed' | 'pending' | 'cancelled'
  onFilterChange: (filter: 'all' | 'confirmed' | 'pending' | 'cancelled') => void
  hideCampaigns: boolean
  onHideCampaignsChange: (hide: boolean) => void
  isMobile?: boolean
  onNewAppointment: () => void
}

export function CalendarHeader({
  currentMonth,
  viewDuration,
  onViewDurationChange,
  onPrevious,
  onNext,
  onToday,
  filterType,
  onFilterChange,
  hideCampaigns,
  onHideCampaignsChange,
  isMobile = false,
  onNewAppointment
}: CalendarHeaderProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const filterOptions = [
    { value: 'all', label: 'Alle afspraken' },
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'pending', label: 'In afwachting' },
    { value: 'cancelled', label: 'Geannuleerd' }
  ]
  
  const viewOptions = [
    { value: '1week', label: '1 Week' },
    { value: '2weeks', label: '2 Weken' },
    { value: '1month', label: '1 Maand' }
  ]
  
  return (
    <div className={`${isMobile ? 'min-h-[120px] px-4 py-4' : 'px-6 py-4'} ${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'} bg-white rounded-xl`}>
      {/* Top Row on Mobile / Left Section on Desktop */}
      <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'gap-4'}`}>
        {/* Left Group */}
        <div className="flex items-center gap-2">
          {/* Calendar Icon - Hidden on mobile */}
          {!isMobile && (
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          {/* Filter Button */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-1.5'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[40px]`}
            >
              <Filter className="w-4 h-4 text-gray-600" />
              {!isMobile && <span className="text-sm font-medium text-gray-700">Filter</span>}
            </button>
          
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(option.value as any)
                    setShowFilterDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    filterType === option.value ? 'bg-gray-50 text-[#02011F] font-medium' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        </div>
        
        {/* Current Month */}
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 capitalize`}>{currentMonth}</h2>
      </div>
      
      {/* Middle Row on Mobile / Center Section on Desktop - Navigation */}
      {isMobile && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[40px] min-h-[40px]"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            
            <button
              onClick={onToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[40px]"
            >
              Vandaag
            </button>
            
            <button
              onClick={onNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[40px] min-h-[40px]"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* View Duration on Mobile */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewDurationChange('1week')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                viewDuration === '1week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              1W
            </button>
            <button
              onClick={() => onViewDurationChange('2weeks')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                viewDuration === '2weeks'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              2W
            </button>
          </div>
        </div>
      )}
      
      {!isMobile && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={onToday}
            className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Vandaag
          </button>
          
          <button
            onClick={onNext}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Mobile New Appointment Button */}
      {isMobile && (
        <div className="flex justify-center w-full">
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-4 py-2 bg-[#02011F] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe afspraak</span>
          </button>
        </div>
      )}
      
      {/* Right Section - Hidden on Mobile */}
      {!isMobile && (
        <div className="flex items-center gap-4">
          {/* Hide Campaigns Toggle */}
          <button
            onClick={() => onHideCampaignsChange(!hideCampaigns)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {hideCampaigns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Verberg Campagnes</span>
          </button>
          
          {/* View Duration Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {viewOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onViewDurationChange(option.value as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewDuration === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* New Appointment Button */}
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-4 py-2 bg-[#02011F] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe afspraak</span>
          </button>
        </div>
      )}
    </div>
  )
}