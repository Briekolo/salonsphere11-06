'use client'

import { useState } from 'react'
import { CalendarView } from './CalendarView'
import { AppointmentsList } from './AppointmentsList'
import { AppointmentFilters } from './AppointmentFilters'
import { QuickStats } from './QuickStats'

export function AgendaContent() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Quick Stats */}
      <QuickStats />
      
      {/* Filters and View Toggle */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="overflow-x-auto">
          <AppointmentFilters />
        </div>
        
        <div className="flex bg-gray-100 rounded-full p-1 self-start lg:self-auto">
          <button
            onClick={() => setView('calendar')}
            className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center ${
              view === 'calendar'
                ? 'bg-[#02011F] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kalender
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center ${
              view === 'list'
                ? 'bg-[#02011F] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lijst
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 mobile-gap">
        {view === 'calendar' ? (
          <>
            <div className="lg:col-span-8">
              <CalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </div>
            <div className="lg:col-span-4">
              <AppointmentsList selectedDate={selectedDate} />
            </div>
          </>
        ) : (
          <div className="lg:col-span-12">
            <AppointmentsList selectedDate={selectedDate} listView />
          </div>
        )}
      </div>
    </div>
  )
}