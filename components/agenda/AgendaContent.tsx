'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { CalendarView } from './CalendarView'
import { EnhancedCalendarView } from './EnhancedCalendarView'
import { AssemblyCalendarView } from './AssemblyCalendarView'
import { KiboCalendarView, viewModeAtom, currentDateAtom } from './KiboCalendarView'
import { AppointmentsList } from './AppointmentsList'
import { AppointmentFilters } from './AppointmentFilters'
import { QuickStats } from './QuickStats'
import { AppointmentMetrics } from './AppointmentMetrics'

export function AgendaContent() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Read calendar view state from atoms
  const [viewMode] = useAtom(viewModeAtom)
  const [currentDate] = useAtom(currentDateAtom)
  
  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    payment: 'all',
    service: 'all',
    staff: 'all'
  })

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">

      {/* Key Metrics - Enhanced version with appointment metrics */}
      <AppointmentMetrics viewMode={viewMode} currentDate={currentDate} />
      
      {/* Appointment Filters */}
      <AppointmentFilters onFiltersChange={setFilters} />
      
      {/* View Toggle */}
      <div className="flex justify-center sm:justify-end">
        <div className="flex bg-gray-100 rounded-full p-1 w-full sm:w-auto max-w-xs">
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 sm:flex-initial px-4 sm:px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
              view === 'calendar'
                ? 'bg-[#02011F] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kalender
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 sm:flex-initial px-4 sm:px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
              view === 'list'
                ? 'bg-[#02011F] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lijst
          </button>
        </div>
      </div>
      
      {/* Main Content - Direct Kibo Calendar */}
      {view === 'calendar' ? (
        <KiboCalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} filters={filters} />
      ) : (
        <AppointmentsList selectedDate={selectedDate} listView filters={filters} />
      )}
    </div>
  )
}