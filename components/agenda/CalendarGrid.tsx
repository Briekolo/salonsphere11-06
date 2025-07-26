'use client'

import { useMemo, useRef } from 'react'
import { format, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Booking } from '@/lib/hooks/useBookings'
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture'
import { EventCard } from './EventCard'
import { CalendarSkeleton } from './CalendarSkeleton'
import { Loader2, Plus } from 'lucide-react'

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
  
  // Generate all days in the range
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [startDate, endDate])
  
  // Generate time slots (business hours: 08:00 - 18:00)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour
      })
    }
    return slots
  }, [])
  
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
  
  // Group bookings by date and time slot
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, { 
      allBookings: Booking[], 
      byTimeSlot: Record<number, Booking[]> 
    }> = {}
    
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
      const { slotIndex } = getAppointmentPosition(booking.scheduled_at)
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { allBookings: [], byTimeSlot: {} }
      }
      
      grouped[dateKey].allBookings.push(booking)
      
      // Group by time slot (only for appointments within business hours)
      if (slotIndex !== -1) {
        if (!grouped[dateKey].byTimeSlot[slotIndex]) {
          grouped[dateKey].byTimeSlot[slotIndex] = []
        }
        grouped[dateKey].byTimeSlot[slotIndex].push(booking)
      }
    })
    
    // Sort bookings within each day and time slot by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].allBookings.sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )
      
      Object.keys(grouped[dateKey].byTimeSlot).forEach(slotIndex => {
        grouped[dateKey].byTimeSlot[parseInt(slotIndex)].sort((a, b) => 
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )
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
                      
                      return (
                        <div key={slot.time} className="relative min-h-[60px] border-b border-gray-100 last:border-b-0 group">
                          {/* Time indicator */}
                          <div className="absolute left-1 top-1 text-xs text-gray-400 font-mono z-10 pointer-events-none">
                            {slot.time}
                          </div>
                          
                          {/* Clickable slot area */}
                          {slotBookings.length === 0 && (
                            <button
                              onClick={() => {
                                const slotDate = new Date(day)
                                slotDate.setHours(slot.hour, 0, 0, 0)
                                onEmptySlotClick(slotDate)
                              }}
                              className="absolute inset-0 w-full h-full min-h-[60px] rounded border-2 border-dashed border-transparent hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                            >
                              <span className="text-xl text-gray-300 group-hover:text-gray-400 transition-colors">
                                <Plus className="w-6 h-6" />
                              </span>
                            </button>
                          )}
                          
                          {/* Slot content */}
                          <div className="ml-12 pt-1 pb-1 min-h-[58px] relative">
                            {slotBookings.length > 0 && (
                              <div className="space-y-1">
                                {slotBookings.map(booking => {
                                  const { position } = getAppointmentPosition(booking.scheduled_at)
                                  return (
                                    <div
                                      key={booking.id}
                                      className="relative"
                                      style={{ 
                                        paddingTop: `${position * 0.6}px` // Scale position within slot
                                      }}
                                    >
                                      <EventCard
                                        booking={booking}
                                        onClick={() => onBookingSelect(booking.id)}
                                        isMobile={false}
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                        isDragging={draggedBooking?.id === booking.id}
                                      />
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
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}