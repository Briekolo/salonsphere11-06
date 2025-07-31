'use client'

import { useState } from 'react'
import { Plus, Calendar, Users, Clock, Settings, MoreVertical, Filter } from 'lucide-react'
import { AppointmentMetrics } from './AppointmentMetrics'
import { AppointmentFilters } from './AppointmentFilters'
import { CalendarView } from './CalendarView'
import { EnhancedCalendarView } from './EnhancedCalendarView'
import { AssemblyCalendarView } from './AssemblyCalendarView'
import { KiboCalendarView } from './KiboCalendarView'
import { AppointmentsList } from './AppointmentsList'

export function AppointmentDashboard() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarType, setCalendarType] = useState<'classic' | 'enhanced' | 'assembly' | 'kibo'>('kibo')
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Show Assembly or Kibo view in full screen without padding
  if ((calendarType === 'assembly' || calendarType === 'kibo') && view === 'calendar') {
    if (calendarType === 'assembly') {
      return <AssemblyCalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
    } else {
      return <KiboCalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
    }
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* TEST BANNER */}
      <div className="bg-orange-500 text-white p-4 rounded-lg text-center font-bold animate-pulse">
        🟠 CACHE TEST: {new Date().toLocaleTimeString()} - Als tijd verandert, werkt het! 🟠
      </div>


      {/* Key Metrics Grid */}
      <AppointmentMetrics />

      {/* Header with Unified Control Center */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">
              Quick Actions & Planning
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Snelle acties en geavanceerde planningstools
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 lg:gap-3">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Nieuwe afspraak
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Calendar className="w-4 h-4" />
              Vandaag
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Users className="w-4 h-4" />
              Klanten
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Settings className="w-4 h-4" />
              Instellingen
            </button>
          </div>
        </div>
        
        {/* Quick Action Menu */}
        {showQuickActions && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button className="flex items-center gap-2 p-3 bg-white rounded-lg border hover:border-primary-300 transition-colors text-left">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Nieuwe afspraak</div>
                  <div className="text-xs text-gray-500">Plan een nieuwe afspraak in</div>
                </div>
              </button>
              
              <button className="flex items-center gap-2 p-3 bg-white rounded-lg border hover:border-primary-300 transition-colors text-left">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Verplaats afspraak</div>
                  <div className="text-xs text-gray-500">Wijzig tijd of datum</div>
                </div>
              </button>
              
              <button className="flex items-center gap-2 p-3 bg-white rounded-lg border hover:border-primary-300 transition-colors text-left">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Annuleer afspraak</div>
                  <div className="text-xs text-gray-500">Annuleer bestaande afspraak</div>
                </div>
              </button>
              
              <button className="flex items-center gap-2 p-3 bg-white rounded-lg border hover:border-primary-300 transition-colors text-left">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Bulk acties</div>
                  <div className="text-xs text-gray-500">Meerdere afspraken beheren</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      
      {/* Enhanced Filters and View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex-1">
            <AppointmentFilters />
          </div>
          
          {/* Calendar Type and View Toggle */}
          <div className="flex items-center gap-4">
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
                <button
                  onClick={() => setCalendarType('kibo')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    calendarType === 'kibo'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kibo
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
                <Calendar className="w-4 h-4 mr-2" />
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
                <Filter className="w-4 h-4 mr-2" />
                Lijst
              </button>
            </div>
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
                  {calendarType === 'assembly' ? 'Assembly' : 'Kibo'} view is shown in full screen mode
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