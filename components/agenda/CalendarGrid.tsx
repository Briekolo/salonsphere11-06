'use client'

import { useMemo, useRef } from 'react'
import { format, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Booking } from '@/lib/hooks/useBookings'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture'
import { EventCard } from './EventCard'
import { CalendarSkeleton } from './CalendarSkeleton'
import { Loader2, Plus, Clock } from 'lucide-react'
import { getAppointmentsForTimeSlot, AppointmentWithOverlap } from '@/lib/utils/appointment-overlap'
import { getEarliestOpenTime, getLatestCloseTime, timeToMinutes } from '@/lib/utils/business-hours'

interface CalendarGridProps {
  startDate: Date
  endDate: Date
  bookings: Booking[]
  onDateSelect: (date: Date) => void
  onBookingSelect: (bookingId: string) => void
  onEmptySlotClick: (date: Date) => void
  isLoading?: boolean
  isMobile?: boolean
  viewDuration?: '1week' | '2weeks' | '1month'
  draggedBooking?: Booking | null
  dragOverDate?: Date | null
  onDragStart?: (booking: Booking) => void
  onDragEnd?: () => void
  onDragOver?: (date: Date) => void
  onDrop?: (date: Date) => void
}

export function CalendarGrid({
  startDate,
  endDate,
  bookings,
  onDateSelect,
  onBookingSelect,
  onEmptySlotClick,
  isLoading = false,
  isMobile = false,
  viewDuration = '2weeks',
  draggedBooking,
  dragOverDate,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const { businessHours, isLoading: businessHoursLoading } = useBusinessHours()
  
  // Generate all days in the range
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [startDate, endDate])
  
  // Generate time slots based on business hours
  const timeSlots = useMemo(() => {
    if (!businessHours) {
      // Fallback to default hours if business hours not loaded
      const slots = []
      for (let hour = 8; hour < 18; hour++) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          hour: hour
        })
      }
      return slots
    }

    // Get the earliest opening time and latest closing time across all days
    const earliestOpen = getEarliestOpenTime(businessHours)
    const latestClose = getLatestCloseTime(businessHours)
    
    const startHour = Math.floor(timeToMinutes(earliestOpen) / 60)
    const endHour = Math.ceil(timeToMinutes(latestClose) / 60)
    
    const slots = []
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour
      })
    }
    return slots
  }, [businessHours])
  
  // Helper function to check if a time slot is within business hours for a specific day
  const isSlotWithinBusinessHours = (day: Date, slotHour: number): boolean => {
    if (!businessHours) return true // Default to available if no business hours
    
    const dayOfWeek = day.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    const dayName = dayNames[dayOfWeek]
    
    const dayHours = businessHours[dayName]
    if (dayHours?.closed) return false
    
    const openHour = Math.floor(timeToMinutes(dayHours.open) / 60)
    const closeHour = Math.floor(timeToMinutes(dayHours.close) / 60)
    
    return slotHour >= openHour && slotHour < closeHour
  }
  
  // Helper function to calculate appointment position within time slot
  const getAppointmentPosition = (scheduledAt: string) => {
    const appointmentTime = new Date(scheduledAt)
    const hour = appointmentTime.getHours()
    const minutes = appointmentTime.getMinutes()
    
    // Find the time slot this appointment belongs to
    const slotIndex = timeSlots.findIndex(slot => slot.hour === hour)
    if (slotIndex === -1) return { slotIndex: -1, position: 0 }
    
    // Calculate position within the slot (0-100%)
    const positionInSlot = (minutes / 60) * 100
    
    return { slotIndex, position: positionInSlot }
  }
  
  // Group bookings by date and time slot with overlap detection
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, { 
      allBookings: Booking[], 
      byTimeSlot: Record<number, AppointmentWithOverlap[]> 
    }> = {}
    
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { allBookings: [], byTimeSlot: {} }
      }
      
      grouped[dateKey].allBookings.push(booking)
    })
    
    // Process each day to calculate overlaps
    Object.keys(grouped).forEach(dateKey => {
      const dayBookings = grouped[dateKey].allBookings
      
      // Convert to AppointmentWithOverlap format
      const dayAppointments: AppointmentWithOverlap[] = dayBookings.map(booking => ({
        id: booking.id,
        scheduled_at: booking.scheduled_at,
        duration_minutes: booking.duration_minutes || 60,
        booking
      }))
      
      // Sort by time
      dayAppointments.sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )
      
      // Group by time slots with overlap detection
      timeSlots.forEach((slot, slotIndex) => {
        const slotDate = new Date(dateKey + 'T' + slot.time + ':00')
        const slotAppointments = getAppointmentsForTimeSlot(dayAppointments, slotDate, 60)
        
        if (slotAppointments.length > 0) {
          grouped[dateKey].byTimeSlot[slotIndex] = slotAppointments
        }
      })
    })
    
    return grouped
  }, [bookings, timeSlots])
  
  // Special dates (holidays, etc.)
  const specialDates: Record<string, string> = {
    '2025-05-11': 'Moederdag',
    '2025-12-25': 'Kerstmis',
    '2025-01-01': 'Nieuwjaar'
  }
  
  // Get grid class based on view duration
  const getGridClass = () => {
    if (isMobile) return 'flex flex-col'
    
    const durationClass = viewDuration === '1week' ? 'week-1' : 
                         viewDuration === '2weeks' ? 'week-2' : 
                         'week-4'
    
    return `calendar-grid-assembly ${durationClass}`
  }
  
  if (isLoading) {
    return <CalendarSkeleton isMobile={isMobile} />
  }
  
  return (
    <div ref={gridRef} className="h-full overflow-auto bg-white">
      {/* Grid Container */}
      <div className={`${getGridClass()} min-h-full`}>
        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayData = bookingsByDate[dateKey] || { allBookings: [], byTimeSlot: {} }
          const specialDate = specialDates[dateKey]
          const isCurrentDay = isToday(day)
          const isDragOver = dragOverDate && isSameDay(dragOverDate, day)
          
          const handleDragOverDay = (e: React.DragEvent) => {
            e.preventDefault()
            onDragOver?.(day)
          }
          
          const handleDragLeaveDay = (e: React.DragEvent) => {
            e.preventDefault()
          }
          
          const handleDropDay = (e: React.DragEvent) => {
            e.preventDefault()
            onDrop?.(day)
          }
          
          return (
            <div
              key={index}
              className={`bg-white ${isMobile ? 'border-b' : 'border-r border-gray-200 last:border-r-0'} ${isMobile ? 'mb-2' : 'min-h-full flex flex-col'} ${
                isDragOver ? 'bg-[#02011F]/10 border-[#02011F]/20' : ''
              } transition-colors duration-200`}
              onDragOver={handleDragOverDay}
              onDragLeave={handleDragLeaveDay}
              onDrop={handleDropDay}
            >
              {/* Day Header */}
              <div 
                className={`${isMobile ? '' : 'sticky top-0 z-10'} bg-white border-b border-gray-200 ${isMobile ? 'p-2' : 'p-3'} ${
                  isCurrentDay ? 'bg-[#02011F]/5' : ''
                }`}
              >
                <div className={`${isMobile ? 'flex items-center justify-between' : 'text-center'}`}>
                  <div className={`${isMobile ? 'flex items-baseline gap-2' : ''}`}>
                    <div className={`font-medium text-gray-500 ${isMobile ? 'text-sm' : 'text-xs uppercase'}`}>
                      {format(day, isMobile ? 'EEEE' : 'EEE', { locale: nl })}
                    </div>
                    <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg mt-1'} ${
                      isCurrentDay ? 'text-[#02011F]' : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  {specialDate && (
                    <div className="text-xs text-orange-600 font-medium">
                      {specialDate}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Day Content with Time Slots */}
              <div className={`${isMobile ? 'px-3 pb-3' : 'p-1'} flex-1`}>
                {isMobile ? (
                  /* Mobile: Simple list view */
                  dayData.allBookings.length > 0 ? (
                    <div className="grid gap-2">
                      {dayData.allBookings.map(booking => (
                        <EventCard
                          key={booking.id}
                          booking={booking}
                          onClick={() => onBookingSelect(booking.id)}
                          isMobile={isMobile}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          isDragging={draggedBooking?.id === booking.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => onEmptySlotClick(day)}
                      className="w-full min-h-[80px] border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-400"
                    >
                      <span className="text-sm">Geen afspraken</span>
                    </button>
                  )
                ) : (
                  /* Desktop: Time slot view */
                  <div className="space-y-0">
                    {timeSlots.map((slot, slotIndex) => {
                      const slotBookings = dayData.byTimeSlot[slotIndex] || []
                      const isWithinBusinessHours = isSlotWithinBusinessHours(day, slot.hour)
                      
                      return (
                        <div key={slot.time} className={`relative min-h-[60px] border-b border-gray-100 last:border-b-0 group ${
                          !isWithinBusinessHours ? 'bg-gray-50/50' : ''
                        }`}>
                          {/* Time indicator */}
                          <div className={`absolute left-1 top-1 text-xs font-mono z-10 pointer-events-none ${
                            isWithinBusinessHours ? 'text-gray-400' : 'text-gray-300'
                          }`}>
                            {slot.time}
                          </div>
                          
                          {/* Business hours indicator */}
                          {!isWithinBusinessHours && (
                            <div className="absolute left-1 top-6 text-xs text-gray-300 z-10 pointer-events-none flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Gesloten</span>
                            </div>
                          )}
                          
                          {/* Clickable slot area */}
                          {slotBookings.length === 0 && (
                            <button
                              onClick={() => {
                                const slotDate = new Date(day)
                                slotDate.setHours(slot.hour, 0, 0, 0)
                                onEmptySlotClick(slotDate)
                              }}
                              disabled={!isWithinBusinessHours}
                              className={`absolute inset-0 w-full h-full min-h-[60px] rounded border-2 border-dashed transition-colors flex items-center justify-center ${
                                isWithinBusinessHours 
                                  ? 'border-transparent hover:border-gray-300 hover:bg-gray-50' 
                                  : 'border-transparent cursor-not-allowed'
                              }`}
                              title={!isWithinBusinessHours ? 'Buiten openingstijden' : ''}
                            >
                              <span className={`text-xl transition-colors ${
                                isWithinBusinessHours 
                                  ? 'text-gray-300 group-hover:text-gray-400' 
                                  : 'text-gray-200'
                              }`}>
                                <Plus className="w-6 h-6" />
                              </span>
                            </button>
                          )}
                          
                          {/* Slot content */}
                          <div className="ml-12 pt-1 pb-1 min-h-[58px] relative">
                            {slotBookings.length > 0 && (
                              <div className="grid gap-1" style={{
                                gridTemplateColumns: slotBookings.length === 1 
                                  ? '1fr' 
                                  : `repeat(${Math.min(slotBookings.length, 3)}, 1fr)`
                              }}>
                                {slotBookings.slice(0, 3).map(appointment => {
                                  const booking = (appointment as any).booking as Booking
                                  
                                  return (
                                    <EventCard
                                      key={appointment.id}
                                      booking={booking}
                                      onClick={() => onBookingSelect(booking.id)}
                                      isMobile={false}
                                      onDragStart={onDragStart}
                                      onDragEnd={onDragEnd}
                                      isDragging={draggedBooking?.id === booking.id}
                                      isOverlapping={slotBookings.length > 1}
                                    />
                                  )
                                })}
                                
                                {/* Overflow indicator for desktop */}
                                {slotBookings.length > 3 && (
                                  <div className="flex items-center justify-center px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded border border-gray-300">
                                    +{slotBookings.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}