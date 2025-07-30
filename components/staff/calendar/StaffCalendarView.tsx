'use client'

import React, { useState, useMemo } from 'react'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  getWeek
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, Plus } from 'lucide-react'
import { useStaffBookings, useStaffTodaysBookings, useStaffPermission } from '@/lib/hooks/useStaffBookings'
import { useStaffAuth } from '@/lib/hooks/useStaffAuth'
import { StaffBookingWithRelations } from '@/lib/services/staffBookingService'
import { getAppointmentsForTimeSlot, AppointmentWithOverlap } from '@/lib/utils/appointment-overlap'

// Atoms for managing calendar state (reusing pattern from KiboCalendarView)
export const staffViewModeAtom = atomWithStorage<'week' | 'month'>('staffCalendarViewMode', 'week')
export const staffCurrentDateAtom = atomWithStorage('staffCalendarCurrentDate', new Date().toISOString())

interface StaffCalendarViewProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onBookingSelect?: (booking: StaffBookingWithRelations) => void
  showAddButton?: boolean
}

export function StaffCalendarView({ 
  selectedDate = new Date(), 
  onDateSelect,
  onBookingSelect,
  showAddButton = true 
}: StaffCalendarViewProps) {
  const [viewMode, setViewMode] = useAtom(staffViewModeAtom)
  const [currentDateStr, setCurrentDateStr] = useAtom(staffCurrentDateAtom)
  const currentDate = new Date(currentDateStr)
  
  const { user } = useStaffAuth()
  const { data: canViewAll } = useStaffPermission('can_view_all_appointments')
  const { data: canEditAll } = useStaffPermission('can_edit_all_appointments')
  const { data: canManageOwnSchedule } = useStaffPermission('can_manage_own_schedule')

  // Get date range for current view
  const { startDate, endDate } = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = addDays(start, 6)
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      }
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      }
    }
  }, [currentDate, viewMode])

  // Fetch bookings for current view
  const { data: bookings = [], isLoading } = useStaffBookings(
    canViewAll ? undefined : user?.id, // If can view all, don't filter by staff
    startDate,
    endDate
  )

  // Navigate calendar
  const navigatePrevious = () => {
    const newDate = viewMode === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1)
    setCurrentDateStr(newDate.toISOString())
  }

  const navigateNext = () => {
    const newDate = viewMode === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1)
    setCurrentDateStr(newDate.toISOString())
  }

  const goToToday = () => {
    setCurrentDateStr(new Date().toISOString())
  }

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookings.filter(booking => 
      booking.scheduled_at && booking.scheduled_at.startsWith(dateStr)
    )
  }

  // Handle booking click
  const handleBookingClick = (booking: StaffBookingWithRelations) => {
    onBookingSelect?.(booking)
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    onDateSelect?.(date)
    setCurrentDateStr(date.toISOString())
  }

  // Render booking item
  const renderBooking = (booking: StaffBookingWithRelations) => {
    const startTime = booking.scheduled_at ? format(new Date(booking.scheduled_at), 'HH:mm') : ''
    const isOwnBooking = booking.staff_id === user?.id

    return (
      <div
        key={booking.id}
        onClick={() => handleBookingClick(booking)}
        className={`
          text-xs p-1.5 mb-1 rounded cursor-pointer border-l-3 transition-all hover:shadow-sm
          ${isOwnBooking 
            ? 'bg-blue-50 border-l-blue-400 text-blue-900 hover:bg-blue-100' 
            : 'bg-gray-50 border-l-gray-400 text-gray-700 hover:bg-gray-100'
          }
        `}
        title={`${startTime} - ${booking.clients?.first_name} ${booking.clients?.last_name} - ${booking.services?.name}`}
      >
        <div className="font-medium truncate">{startTime}</div>
        <div className="truncate">
          {booking.clients?.first_name} {booking.clients?.last_name}
        </div>
        {booking.services?.name && (
          <div className="truncate text-gray-600">{booking.services.name}</div>
        )}
        {!isOwnBooking && booking.users && (
          <div className="truncate text-xs text-gray-500">
            {booking.users.first_name} {booking.users.last_name}
          </div>
        )}
      </div>
    )
  }

  if (viewMode === 'week') {
    // Week View
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Agenda - Week {getWeek(currentDate)}
              </h2>
              <div className="text-sm text-gray-600">
                {format(weekStart, 'd MMM', { locale: nl })} - {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: nl })}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    viewMode === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    viewMode === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Maand
                </button>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={navigatePrevious}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Vandaag
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Week Grid */}
        <div className="flex">
          {/* Time column */}
          <div className="w-16 border-r border-gray-200">
            <div className="h-12 border-b border-gray-200"></div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 p-1 text-xs text-gray-500">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day) => {
            const dayBookings = getBookingsForDate(day)
            const isSelectedDay = isSameDay(day, selectedDate)
            const isTodayDay = isToday(day)

            return (
              <div key={day.toISOString()} className="flex-1 border-r border-gray-200 last:border-r-0">
                {/* Day header */}
                <div 
                  className={`h-12 border-b border-gray-200 p-2 cursor-pointer transition-colors ${
                    isSelectedDay 
                      ? 'bg-blue-50 border-blue-200' 
                      : isTodayDay 
                        ? 'bg-amber-50' 
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="text-xs text-gray-600 font-medium">
                    {format(day, 'EEE', { locale: nl })}
                  </div>
                  <div className={`text-sm font-bold ${
                    isTodayDay ? 'text-amber-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Day content - simplified view showing bookings in time slots */}
                <div className="relative">
                  {Array.from({ length: 24 }, (_, hour) => {
                    // Convert day bookings to appointment format
                    const dayAppointments: AppointmentWithOverlap[] = dayBookings.map(booking => ({
                      id: booking.id,
                      scheduled_at: booking.scheduled_at,
                      duration_minutes: booking.duration_minutes || 60,
                      booking
                    }))
                    
                    // Get hour slot date
                    const hourSlotDate = new Date(day)
                    hourSlotDate.setHours(hour, 0, 0, 0)
                    
                    // Get appointments for this hour slot with overlap detection
                    const hourAppointments = getAppointmentsForTimeSlot(dayAppointments, hourSlotDate, 60)

                    return (
                      <div key={hour} className="h-16 border-b border-gray-100 p-1">
                        {hourAppointments.length > 0 && (
                          <div className="grid gap-1 h-full" style={{
                            gridTemplateColumns: hourAppointments.length === 1 
                              ? '1fr' 
                              : `repeat(${Math.min(hourAppointments.length, 2)}, 1fr)`
                          }}>
                            {hourAppointments.slice(0, 2).map((appointment) => {
                              const booking = (appointment as any).booking as StaffBookingWithRelations
                              
                              return (
                                <div key={appointment.id} className="min-w-0">
                                  {renderBooking(booking)}
                                </div>
                              )
                            })}
                            
                            {/* Overflow indicator for more than 2 appointments */}
                            {hourAppointments.length > 2 && (
                              <div className="flex items-center justify-center text-xs text-gray-500 bg-gray-100 rounded px-1">
                                +{hourAppointments.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
            <div className="text-gray-600">Laden...</div>
          </div>
        )}
      </div>
    )
  }

  // Month View
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: nl })}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Maand
              </button>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Vandaag
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Month Grid */}
      <div>
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayBookings = getBookingsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelectedDay = isSameDay(day, selectedDate)
            const isTodayDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[120px] p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer transition-colors
                  ${isSelectedDay 
                    ? 'bg-blue-50 border-blue-200' 
                    : isTodayDay 
                      ? 'bg-amber-50' 
                      : isCurrentMonth 
                        ? 'hover:bg-gray-50' 
                        : 'bg-gray-50 hover:bg-gray-100'
                  }
                `}
              >
                <div className={`text-sm font-bold mb-1 ${
                  !isCurrentMonth 
                    ? 'text-gray-400' 
                    : isTodayDay 
                      ? 'text-amber-600' 
                      : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => renderBooking(booking))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-500 p-1">
                      +{dayBookings.length - 3} meer
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="text-gray-600">Laden...</div>
        </div>
      )}
    </div>
  )
}