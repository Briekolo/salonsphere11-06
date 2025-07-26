'use client'

import { useState } from 'react'
import { CalendarView } from './CalendarView'
import { EnhancedCalendarView } from './EnhancedCalendarView'
import { AssemblyCalendarView } from './AssemblyCalendarView'
import { AppointmentsList } from './AppointmentsList'
import { AppointmentFilters } from './AppointmentFilters'
import { QuickStats } from './QuickStats'

export function AgendaContent() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarType, setCalendarType] = useState<'classic' | 'enhanced' | 'assembly'>('assembly') // Default to assembly view

  // Show Assembly view in full screen without padding
  if (calendarType === 'assembly' && view === 'calendar') {
    return <AssemblyCalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Quick Stats */}
      <QuickStats />
      
      {/* Filters and View Toggle */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="overflow-x-auto">
          <AppointmentFilters />
        </div>
        
        <div className="flex gap-4 items-center">
          {/* Calendar Type Toggle */}
          {view === 'calendar' && (
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setCalendarType('classic')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  calendarType === 'classic'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setCalendarType('enhanced')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  calendarType === 'enhanced'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Enhanced
              </button>
              <button
                onClick={() => setCalendarType('assembly')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  calendarType === 'assembly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Modern
              </button>
            </div>
          )}
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-full p-1">
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
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 mobile-gap">
        {view === 'calendar' ? (
          <>
            <div className="lg:col-span-8">
              {calendarType === 'enhanced' ? (
                <EnhancedCalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              ) : calendarType === 'classic' ? (
                <CalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              ) : (
                <div className="bg-white rounded-lg p-4 text-center text-gray-500">
                  Assembly view is shown in full screen mode
                </div>
              )}
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