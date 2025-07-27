'use client'

import { useState } from 'react'
import { CalendarView } from './CalendarView'
import { EnhancedCalendarView } from './EnhancedCalendarView'
import { AssemblyCalendarView } from './AssemblyCalendarView'
import { KiboCalendarView } from './KiboCalendarView'
import { AppointmentsList } from './AppointmentsList'
import { AppointmentFilters } from './AppointmentFilters'
import { QuickStats } from './QuickStats'
import { AppointmentMetrics } from './AppointmentMetrics'

export function AgendaContent() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
          Afspraken Dashboard
        </h1>
        <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">
          Centraal overzicht en beheer van alle afspraken en planning
        </p>
      </div>

      {/* Key Metrics - Enhanced version with appointment metrics */}
      <AppointmentMetrics />
      
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
        <KiboCalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      ) : (
        <AppointmentsList selectedDate={selectedDate} listView />
      )}
    </div>
  )
}