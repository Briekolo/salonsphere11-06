'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, getDay } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useBookings, useUpdateBooking, Booking } from '@/lib/hooks/useBookings'
import { BookingFormModal } from './BookingFormModal'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, Plus, MoreHorizontal, GripVertical, Phone, Mail, Euro, Star } from 'lucide-react'
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { atom, useAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'

interface KiboCalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

// Jotai atoms for state management
const viewModeAtom = atom<'week' | 'month'>('month')
const currentDateAtom = atom(new Date())
const selectedBookingAtom = atom<string | null>(null)
const draggedBookingAtom = atom<Booking | null>(null)
const hoveredBookingAtom = atom<{ booking: Booking; position: { x: number; y: number } } | null>(null)

// Color mapping for appointment status
const statusColors = {
  confirmed: {
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    modalBorder: 'border-emerald-300',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    accent: 'text-emerald-700'
  },
  scheduled: {
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    modalBorder: 'border-amber-300',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    accent: 'text-amber-700'
  },
  cancelled: {
    bg: 'bg-red-50 hover:bg-red-100 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
    modalBorder: 'border-red-300',
    headerBg: 'bg-red-50',
    headerBorder: 'border-red-200',
    accent: 'text-red-700'
  },
  completed: {
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    modalBorder: 'border-blue-300',
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-200',
    accent: 'text-blue-700'
  }
}

// Hover preview component
function AppointmentHoverPreview({ booking, position }: { 
  booking: Booking; 
  position: { x: number; y: number } 
}) {
  const status = booking.status || 'scheduled'
  const colors = statusColors[status as keyof typeof statusColors]
  
  // Safely parse and validate the date
  const scheduledDate = new Date(booking.scheduled_at)
  const isValidDate = scheduledDate instanceof Date && !isNaN(scheduledDate.getTime())
  const time = isValidDate ? format(scheduledDate, 'HH:mm') : '00:00'
  
  const clientName = booking.clients?.first_name && booking.clients?.last_name 
    ? `${booking.clients.first_name} ${booking.clients.last_name}`
    : 'Onbekend'
  const serviceName = booking.services?.name || 'Behandeling'
  const duration = booking.duration_minutes || 60
  
  // Safely calculate end time
  const endTime = isValidDate 
    ? new Date(scheduledDate.getTime() + duration * 60000)
    : new Date()
  const endTimeFormatted = isValidDate ? format(endTime, 'HH:mm') : '00:00'
  
  const price = booking.services?.price || 0

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 10}px`,
        transform: 'translateY(-100%)'
      }}
    >
      <div className={`bg-white rounded-xl shadow-2xl border-2 p-4 w-80 ${colors.modalBorder}`}>
        {/* Header */}
        <div className={`rounded-lg p-3 mb-3 ${colors.headerBg} ${colors.headerBorder} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
              <span className={`font-semibold ${colors.accent}`}>
                {status === 'confirmed' ? 'Bevestigd' : 
                 status === 'scheduled' ? 'Ingepland' :
                 status === 'completed' ? 'Voltooid' :
                 status === 'cancelled' ? 'Geannuleerd' : 'Onbekend'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{time} - {endTimeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Client info */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{clientName}</div>
              {booking.clients?.email && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span>{booking.clients.email}</span>
                </div>
              )}
              {booking.clients?.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{booking.clients.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service info */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{serviceName}</div>
              <div className="text-sm text-gray-600">{duration} minuten</div>
            </div>
            {price > 0 && (
              <div className="flex items-center gap-1 font-semibold text-gray-900">
                <Euro className="w-4 h-4" />
                <span>{price.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Notities</div>
              <div className="text-sm text-blue-800">{booking.notes}</div>
            </div>
          )}

          {/* Quick actions hint */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Klik om te bewerken</span>
            <span>Sleep het grip-icoon om te verplaatsen</span>
          </div>
        </div>
      </div>

      {/* Arrow pointing to appointment */}
      <div className="absolute left-6 bottom-0 transform translate-y-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
      </div>
    </div>
  )
}

// Compact appointment card for month view with multiple appointments
function CompactAppointmentCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const status = booking.status || 'scheduled'
  const colors = statusColors[status as keyof typeof statusColors]
  
  const scheduledDate = new Date(booking.scheduled_at)
  const isValidDate = scheduledDate instanceof Date && !isNaN(scheduledDate.getTime())
  const time = isValidDate ? format(scheduledDate, 'HH:mm') : '00:00'
  
  const clientName = booking.clients?.first_name || 'Onbekend'
  
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`group p-1 rounded border text-xs cursor-pointer transition-all ${colors.bg} ${colors.text}`}
    >
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
        <span className="font-medium">{time}</span>
        <span className="truncate opacity-90">{clientName}</span>
      </div>
    </div>
  )
}

// Draggable appointment card
function DraggableAppointment({ booking, onClick, compact = false }: { booking: Booking; onClick: () => void; compact?: boolean }) {
  const [hoveredBooking, setHoveredBooking] = useAtom(hoveredBookingAtom)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: {
      booking: booking // Wrap booking in an object to ensure it's properly passed
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  const status = booking.status || 'scheduled'
  const colors = statusColors[status as keyof typeof statusColors]
  
  // Safely parse and validate the date
  const scheduledDate = new Date(booking.scheduled_at)
  const isValidDate = scheduledDate instanceof Date && !isNaN(scheduledDate.getTime())
  const time = isValidDate ? format(scheduledDate, 'HH:mm') : '00:00'
  
  const clientName = booking.clients?.first_name || 'Onbekend'
  const serviceName = booking.services?.name || 'Behandeling'

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) {
      onClick()
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isTouchDevice) {
      const rect = e.currentTarget.getBoundingClientRect()
      setHoveredBooking({
        booking,
        position: {
          x: rect.right,
          y: rect.top + rect.height / 2
        }
      })
    }
  }

  const handleMouseLeave = () => {
    if (!isTouchDevice) {
      setHoveredBooking(null)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative p-1 sm:p-2 rounded-lg border transition-all h-full ${colors.bg} ${colors.text}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clickable content area */}
      <div onClick={handleClick} className="flex items-start gap-1 sm:gap-2 w-full cursor-pointer relative">
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1 sm:mt-1.5 flex-shrink-0 ${colors.dot}`} />
        <div className="flex-1 min-w-0">
          {/* Compact view for 30min appointments */}
          {booking.duration_minutes && booking.duration_minutes <= 30 ? (
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs">{time}</span>
              <span className="text-xs opacity-75">30min</span>
              <span className="text-xs truncate opacity-90 max-w-[80px]">{clientName}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-medium text-xs sm:text-sm">{time}</span>
                <span className="text-xs opacity-75 hidden sm:inline">
                  {booking.duration_minutes || 60}min
                </span>
              </div>
              <div className="text-xs mt-0.5 truncate opacity-90">{clientName}</div>
              <div className="text-xs truncate opacity-75 hidden sm:block">{serviceName}</div>
              {booking.duration_minutes && booking.duration_minutes > 60 && (
                <div className="text-xs text-orange-600 font-medium">
                  Lange behandeling ({Math.round(booking.duration_minutes / 60 * 10) / 10}u)
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Drag handle - touch-friendly for mobile */}
        <div 
          {...listeners}
          className={`absolute top-0 right-0 flex items-center justify-center cursor-move transition-opacity bg-white/80 rounded-bl-md
            ${isTouchDevice 
              ? 'w-8 h-8 opacity-40' 
              : 'w-5 h-5 opacity-0 group-hover:opacity-60 hover:!opacity-100'
            }`}
          title="Sleep om te verplaatsen"
          onClick={(e) => e.stopPropagation()} // Prevent triggering the appointment click
        >
          <GripVertical className={`${isTouchDevice ? 'w-4 h-4' : 'w-3 h-3'}`} />
        </div>
      </div>
    </div>
  )
}

// Week view with vertical hours
function WeekView({ weekDays, bookingsByDate, onEmptyClick, onBookingClick }: {
  weekDays: Date[]
  bookingsByDate: Record<string, Booking[]>
  onEmptyClick: (date: Date) => void
  onBookingClick: (bookingId: string) => void
}) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  // Generate hours from 7:00 to 22:00 (salon hours)
  const hours = Array.from({ length: 16 }, (_, i) => i + 7) // 7 to 22
  
  // Current time calculation
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const isCurrentTimeVisible = currentHour >= 7 && currentHour <= 22
  
  // Calculate position of current time line
  const getCurrentTimePosition = () => {
    if (!isCurrentTimeVisible) return null
    
    const hourIndex = currentHour - 7 // Offset for 7am start
    const minutePercentage = currentMinutes / 60
    const position = (hourIndex + minutePercentage) * 64 + 48 // 64px per hour + 48px header
    
    return position
  }
  
  const currentTimePosition = getCurrentTimePosition()

  const getBookingPosition = (booking: Booking, hour: number) => {
    const bookingTime = new Date(booking.scheduled_at)
    const isValidDate = bookingTime instanceof Date && !isNaN(bookingTime.getTime())
    
    if (!isValidDate) {
      console.warn('Invalid booking time in getBookingPosition:', booking.scheduled_at)
      return null
    }
    
    const bookingHour = bookingTime.getHours()
    const bookingMinutes = bookingTime.getMinutes()
    const duration = booking.duration_minutes || 60
    
    // Calculate if this booking spans into this hour slot
    const bookingEndTime = new Date(bookingTime.getTime() + duration * 60000)
    const bookingEndHour = bookingEndTime.getHours()
    const bookingEndMinutes = bookingEndTime.getMinutes()
    
    // Check if booking starts in this hour or overlaps with this hour
    const startsInThisHour = bookingHour === hour
    const endsAfterThisHour = bookingEndHour > hour || (bookingEndHour === hour && bookingEndMinutes > 0)
    const startsBeforeThisHour = bookingHour < hour
    
    if (startsInThisHour) {
      // Booking starts in this hour
      const top = (bookingMinutes / 60) * 100
      const availableMinutesInHour = 60 - bookingMinutes
      const heightMinutes = Math.min(duration, availableMinutesInHour)
      const height = (heightMinutes / 60) * 100
      return { 
        top: `${top}%`, 
        height: `${height}%`,
        isStart: true,
        isContinuation: false,
        totalDuration: duration,
        overflowsToNext: duration > availableMinutesInHour
      }
    } else if (startsBeforeThisHour && endsAfterThisHour) {
      // Booking continues in this hour (overflow from previous hour)
      const minutesFromStart = (hour - bookingHour) * 60 - bookingMinutes
      const remainingDuration = duration - minutesFromStart
      const heightMinutes = Math.min(remainingDuration, 60)
      const height = (heightMinutes / 60) * 100
      return { 
        top: '0%', 
        height: `${height}%`,
        isStart: false,
        isContinuation: true,
        totalDuration: duration,
        overflowsToNext: remainingDuration > 60
      }
    }
    return null
  }

  // Mobile: Show day selector and single day view
  // Desktop: Show full week view
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    const selectedDate = weekDays[selectedDayIndex]
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    const dayBookings = bookingsByDate[dateKey] || []
    const isTodayDate = isToday(selectedDate)

    return (
      <div className="flex flex-col h-full">
        {/* Mobile Day Selector */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={selectedDayIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-medium">
              {format(selectedDate, 'EEEE', { locale: nl })}
            </div>
            <div className={`text-sm ${isTodayDate ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
              {format(selectedDate, 'd MMMM', { locale: nl })}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedDayIndex(Math.min(6, selectedDayIndex + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={selectedDayIndex === 6}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile Single Day View */}
        <div className="flex flex-1 overflow-hidden">
          {/* Time column */}
          <div className="w-14 border-r border-gray-200 bg-gray-50">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 flex items-start justify-center pt-1">
                <span className="text-xs text-gray-500 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="flex-1 relative overflow-visible">
            {/* Current time indicator for mobile */}
            {currentTimePosition && isTodayDate && (
              <div 
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${currentTimePosition - 48}px` }}
              >
                <div className="absolute -left-14 bg-red-500 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                  {now.toLocaleTimeString('nl-NL', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </div>
                <div className="absolute left-0 right-0 h-0.5 bg-red-500">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            )}

            {/* Hours for this day */}
            {hours.map((hour) => (
              <TimeSlot
                key={`${dateKey}-${hour}`}
                date={selectedDate}
                hour={hour}
                bookings={dayBookings.filter(booking => {
                  const bookingTime = new Date(booking.scheduled_at)
                  const isValidDate = bookingTime instanceof Date && !isNaN(bookingTime.getTime())
                  if (!isValidDate) return false
                  
                  const bookingHour = bookingTime.getHours()
                  // Only include bookings that START in this hour
                  return bookingHour === hour
                })}
                onEmptyClick={onEmptyClick}
                onBookingClick={onBookingClick}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Desktop Week View
  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Time column */}
      <div className="w-16 border-r border-gray-200 bg-gray-50 relative z-10">
        <div className="h-12 border-b border-gray-200"></div> {/* Header spacer */}
        {hours.map((hour) => (
          <div key={hour} className="h-16 border-b border-gray-100 flex items-start justify-center pt-1">
            <span className="text-xs text-gray-500 font-medium">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      {currentTimePosition && (
        <div 
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: `${currentTimePosition}px` }}
        >
          {/* Time label */}
          <div className="absolute left-1 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium shadow-md">
            {now.toLocaleTimeString('nl-NL', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
          {/* Red line */}
          <div className="absolute left-16 right-0 top-2 h-0.5 bg-red-500 shadow-sm">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Days columns */}
      <div className="flex-1 grid grid-cols-7">
        {weekDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd')
          const dayBookings = bookingsByDate[dateKey] || []
          const isTodayDate = isToday(date)

          return (
            <div key={dateKey} className="border-r border-gray-200 last:border-r-0">
              {/* Day header */}
              <div className={`h-12 border-b border-gray-200 flex flex-col items-center justify-center px-2 ${
                isTodayDate ? 'bg-blue-50' : 'bg-white'
              }`}>
                <div className="text-xs text-gray-500 uppercase">
                  {format(date, 'E', { locale: nl })}
                </div>
                <div className={`text-sm font-medium ${
                  isTodayDate ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {format(date, 'd')}
                </div>
              </div>

              {/* Hours grid for this day */}
              <div className="relative overflow-visible">
                {hours.map((hour) => (
                  <TimeSlot
                    key={`${dateKey}-${hour}`}
                    date={date}
                    hour={hour}
                    bookings={dayBookings.filter(booking => {
                      const bookingTime = new Date(booking.scheduled_at)
                      const isValidDate = bookingTime instanceof Date && !isNaN(bookingTime.getTime())
                      if (!isValidDate) return false
                      
                      const bookingHour = bookingTime.getHours()
                      // Only include bookings that START in this hour
                      return bookingHour === hour
                    })}
                    onEmptyClick={onEmptyClick}
                    onBookingClick={onBookingClick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Quarter hour slot component for 15-minute intervals
function QuarterHourSlot({ date, hour, quarter, isOver, onEmptyClick }: {
  date: Date
  hour: number
  quarter: number // 0 (00min), 1 (15min), 2 (30min), 3 (45min)
  isOver: boolean
  onEmptyClick: () => void
}) {
  const minutes = quarter * 15
  const slotDate = new Date(date)
  slotDate.setHours(hour, minutes, 0, 0)
  slotDate.setSeconds(0)
  slotDate.setMilliseconds(0)
  
  const dropId = `drop-${format(date, 'yyyy-MM-dd')}-${hour}-${minutes}`
  
  const { setNodeRef, isOver: quarterIsOver } = useDroppable({
    id: dropId,
    data: { 
      date: slotDate,
      hour: hour,
      minutes: minutes
    }
  })
  
  // Debug logging
  useEffect(() => {
    console.log('QuarterHourSlot mounted:', {
      id: dropId,
      setNodeRef: !!setNodeRef,
      isOver: quarterIsOver,
      date: format(slotDate, 'yyyy-MM-dd HH:mm')
    })
  }, [])

  return (
    <div
      ref={setNodeRef}
      className={`absolute h-4 w-full cursor-pointer transition-colors ${
        quarterIsOver ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-50'
      } ${quarter < 3 ? 'border-b border-gray-50' : ''}`}
      style={{ top: `${quarter * 16}px` }}
      onClick={onEmptyClick}
      title={`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`}
    >
      {/* Time indicator on hover - positioned above the slot */}
      {quarterIsOver && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium whitespace-nowrap">
          {hour.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
          {/* Arrow pointing down */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-600"></div>
        </div>
      )}
    </div>
  )
}

// Individual time slot component with 15-minute intervals
function TimeSlot({ date, hour, bookings, onEmptyClick, onBookingClick }: {
  date: Date
  hour: number
  bookings: Booking[]
  onEmptyClick: (date: Date) => void
  onBookingClick: (bookingId: string) => void
}) {
  // Hour slot height in pixels - using rem values
  const HOUR_HEIGHT = 64 // 4rem = 64px at default font size

  return (
    <div className="relative h-16 border-b border-gray-100 overflow-visible">
      {/* Four quarter-hour slots */}
      {[0, 1, 2, 3].map((quarter) => {
        const minutes = quarter * 15
        return (
          <QuarterHourSlot
            key={quarter}
            date={date}
            hour={hour}
            quarter={quarter}
            isOver={false}
            onEmptyClick={() => {
              const slotDate = new Date(date)
              slotDate.setHours(hour, minutes, 0, 0)
              onEmptyClick(slotDate)
            }}
          />
        )
      })}

      {/* Appointments in this hour */}
      {bookings.map((booking) => {
        const bookingTime = new Date(booking.scheduled_at)
        const isValidDate = bookingTime instanceof Date && !isNaN(bookingTime.getTime())
        
        if (!isValidDate) {
          console.warn('Invalid booking time in TimeSlot:', booking.scheduled_at, 'for booking:', booking.id)
          return null
        }
        
        const minutes = bookingTime.getMinutes()
        const duration = booking.duration_minutes || 60
        
        // Calculate position and height in pixels
        const topPixels = (minutes / 60) * HOUR_HEIGHT
        const heightPixels = (duration / 60) * HOUR_HEIGHT
        
        return (
          <div
            key={booking.id}
            className="absolute left-1 right-1 z-10"
            style={{
              top: `${topPixels}px`,
              height: `${heightPixels}px`
            }}
          >
            <DraggableAppointment
              booking={booking}
              onClick={() => onBookingClick(booking.id)}
            />
          </div>
        )
      })}
    </div>
  )
}

// Droppable calendar cell
function CalendarCell({ date, bookings, onDrop, onEmptyClick, onBookingClick }: { 
  date: Date; 
  bookings: Booking[]; 
  onDrop: (date: Date) => void;
  onEmptyClick: (date: Date) => void;
  onBookingClick: (bookingId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
    data: { 
      date: date.toISOString() // Convert to ISO string to ensure proper serialization
    }
  })

  const isCurrentDay = isToday(date)
  const dayNumber = format(date, 'd')
  const hasBookings = bookings.length > 0
  
  // Responsive max visible appointments
  const [maxVisible, setMaxVisible] = useState(3)
  
  useEffect(() => {
    const updateMaxVisible = () => {
      if (window.innerWidth < 640) { // mobile
        setMaxVisible(1)
      } else if (window.innerWidth < 1024) { // tablet
        setMaxVisible(2)
      } else { // desktop
        setMaxVisible(3)
      }
    }
    
    updateMaxVisible()
    window.addEventListener('resize', updateMaxVisible)
    return () => window.removeEventListener('resize', updateMaxVisible)
  }, [])
  
  const hiddenCount = bookings.length - maxVisible

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        // Only trigger if clicking on empty space, not on appointments
        if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
          const targetElement = e.target as HTMLElement
          if (!targetElement.closest('[role="button"]') && !targetElement.closest('button')) {
            onEmptyClick(date)
          }
        }
      }}
      className={`
        relative min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-2 border-r border-b border-gray-200
        ${isCurrentDay ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'}
        ${isOver ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}
        transition-all cursor-pointer
      `}
    >
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className={`text-xs sm:text-sm font-medium ${isCurrentDay ? 'text-primary-700' : 'text-gray-700'}`}>
          {dayNumber}
        </span>
        <button
          onClick={() => onEmptyClick(date)}
          className="opacity-0 hover:opacity-100 transition-opacity p-0.5 sm:p-1 hover:bg-gray-200 rounded"
        >
          <Plus className="w-3 h-3 text-gray-600" />
        </button>
      </div>

      <div className="space-y-0.5 sm:space-y-1">
        {bookings.length >= 2 ? (
          // Compact view for 2 or more appointments
          <>
            {bookings.slice(0, maxVisible).map((booking) => (
              <CompactAppointmentCard
                key={booking.id}
                booking={booking}
                onClick={() => onBookingClick(booking.id)}
              />
            ))}
            {hiddenCount > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  // Could implement expand functionality here
                }}
                className="w-full text-left text-xs text-gray-500 hover:text-gray-700 py-0.5 px-1 hover:bg-gray-100 rounded transition-colors"
              >
                +{hiddenCount} meer
              </button>
            )}
          </>
        ) : (
          // Regular view for single appointment
          bookings.map((booking) => (
            <DraggableAppointment
              key={booking.id}
              booking={booking}
              onClick={() => onBookingClick(booking.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Calendar header with navigation
function CalendarHeader({ viewMode, onViewModeChange, currentDate, onNavigate }: {
  viewMode: 'week' | 'month'
  onViewModeChange: (mode: 'week' | 'month') => void
  currentDate: Date
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
}) {
  const displayText = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      
      // If same month, show "d - d MMM"
      // If different months, show "d MMM - d MMM"
      if (format(weekStart, 'MMM') === format(weekEnd, 'MMM')) {
        return `${format(weekStart, 'd')} - ${format(weekEnd, 'd MMM', { locale: nl })}`
      } else {
        return `${format(weekStart, 'd MMM', { locale: nl })} - ${format(weekEnd, 'd MMM', { locale: nl })}`
      }
    }
    return format(currentDate, 'MMM yyyy', { locale: nl })
  }, [viewMode, currentDate])

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Mobile: Stack elements vertically */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 capitalize">{displayText}</h2>
          
          {/* Mobile: Show view mode toggle on the right */}
          <div className="flex sm:hidden bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewModeChange('month')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              Maand
            </button>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onNavigate('today')}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
            >
              Vandaag
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Desktop view mode toggle */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'week' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => onViewModeChange('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'month' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Maand
              </button>
            </div>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function KiboCalendarView({ selectedDate, onDateSelect }: KiboCalendarViewProps) {
  const [viewMode, setViewMode] = useAtom(viewModeAtom)
  const [currentDate, setCurrentDate] = useAtom(currentDateAtom)
  const [draggedBooking, setDraggedBooking] = useAtom(draggedBookingAtom)
  const [hoveredBooking, setHoveredBooking] = useAtom(hoveredBookingAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [initialModalDate, setInitialModalDate] = useState<Date | undefined>()

  const queryClient = useQueryClient()
  const updateBookingMutation = useUpdateBooking()

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday = 1
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return { start, end }
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      return { start, end }
    }
  }, [currentDate, viewMode])

  // Fetch bookings
  const { data: bookings = [], isLoading } = useBookings(
    dateRange.start.toISOString(),
    dateRange.end.toISOString()
  )

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval(dateRange)
    
    // For month view, pad with days from previous/next month
    if (viewMode === 'month') {
      const firstDay = days[0]
      const lastDay = days[days.length - 1]
      
      // Add padding days at the start (Monday = 1, so Sunday = 0 becomes 7)
      const startPadding = getDay(firstDay) === 0 ? 6 : getDay(firstDay) - 1
      for (let i = startPadding - 1; i >= 0; i--) {
        days.unshift(new Date(firstDay.getTime() - (startPadding - i) * 24 * 60 * 60 * 1000))
      }
      
      // Add padding days at the end to make 6 weeks (42 days)
      while (days.length < 42) {
        const nextDay = new Date(days[days.length - 1])
        nextDay.setDate(nextDay.getDate() + 1)
        days.push(nextDay)
      }
    }
    
    return days
  }, [dateRange, viewMode])

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {}
    
    bookings.forEach((booking: Booking) => {
      // Safely parse and validate the date
      const scheduledDate = new Date(booking.scheduled_at)
      const isValidDate = scheduledDate instanceof Date && !isNaN(scheduledDate.getTime())
      
      if (isValidDate) {
        const dateKey = format(scheduledDate, 'yyyy-MM-dd')
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(booking)
      } else {
        console.warn('Invalid booking date found:', booking.scheduled_at, 'for booking:', booking.id)
      }
    })
    
    // Sort bookings by time within each day and remove duplicates
    Object.keys(grouped).forEach(key => {
      // Remove duplicates based on booking ID
      const uniqueBookings = Array.from(
        new Map(grouped[key].map(booking => [booking.id, booking])).values()
      )
      
      grouped[key] = uniqueBookings.sort((a, b) => {
        const dateA = new Date(a.scheduled_at)
        const dateB = new Date(b.scheduled_at)
        const isValidA = dateA instanceof Date && !isNaN(dateA.getTime())
        const isValidB = dateB instanceof Date && !isNaN(dateB.getTime())
        
        // Put invalid dates at the end
        if (!isValidA && !isValidB) return 0
        if (!isValidA) return 1
        if (!isValidB) return -1
        
        return dateA.getTime() - dateB.getTime()
      })
    })
    
    return grouped
  }, [bookings])

  // Navigation handlers
  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date())
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1))
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1))
    }
  }, [viewMode, setCurrentDate])

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    // Try both data structures that DnD Kit might use
    const booking = event.active.data.current?.booking || event.active.data?.booking
    
    console.log('Drag start:', {
      activeId: event.active.id,
      activeCurrent: event.active.data.current,
      activeData: event.active.data,
      booking: booking,
      bookingId: booking?.id,
      scheduledAt: booking?.scheduled_at,
      hasValidDate: booking?.scheduled_at ? !isNaN(new Date(booking.scheduled_at).getTime()) : false
    })
    setDraggedBooking(booking)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedBooking(null)

    console.log('Drag ended:', { 
      activeId: active.id, 
      overId: over?.id,
      activeData: active.data,
      overData: over?.data,
      hasActiveCurrent: !!active.data?.current,
      hasOverCurrent: !!over?.data?.current
    })

    if (!over || !active.data) {
      console.log('Missing over or active.data')
      return
    }

    // Try both data structures that DnD Kit might use
    const booking = active.data.current?.booking || active.data?.booking
    
    console.log('Debug booking data:', {
      activeCurrent: active.data.current,
      activeData: active.data,
      booking: booking,
      activeId: active.id
    })
    
    if (!booking || !booking.id || !booking.scheduled_at) {
      console.error('Invalid booking data:', {
        booking,
        hasId: !!booking?.id,
        hasScheduledAt: !!booking?.scheduled_at,
        activeData: active.data,
        activeCurrent: active.data.current,
        activeId: active.id
      })
      alert('Er is een fout opgetreden: ongeldige afspraakgegevens')
      return
    }
    
    const dropData = over.data.current
    
    console.log('Drop data:', {
      dropData,
      hasDate: !!dropData?.date,
      dateType: typeof dropData?.date,
      overId: over.id,
      overData: over.data
    })
    
    if (!dropData || !dropData.date) {
      console.log('No drop data or date')
      return
    }

    // The date might be a Date object or a string, handle both cases
    let targetDate: Date
    if (dropData.date instanceof Date) {
      targetDate = new Date(dropData.date.getTime())
    } else if (typeof dropData.date === 'string') {
      targetDate = new Date(dropData.date)
    } else {
      console.error('Invalid drop date format:', dropData.date)
      alert('Er is een fout opgetreden: ongeldige datum formaat')
      return
    }

    console.log('Drag data:', { 
      bookingId: booking.id, 
      originalTime: booking.scheduled_at,
      targetDate: targetDate.toISOString(),
      dropZoneId: over.id,
      dropDataType: typeof dropData.date
    })

    try {
      const originalDate = new Date(booking.scheduled_at)
      
      // Enhanced validation with detailed logging
      const originalValid = originalDate instanceof Date && !isNaN(originalDate.getTime())
      const targetValid = targetDate instanceof Date && !isNaN(targetDate.getTime())
      
      console.log('Date validation:', {
        originalDate: booking.scheduled_at,
        originalDateParsed: originalDate.toISOString(),
        originalValid,
        targetDate: targetDate,
        targetDateISO: targetDate.toISOString(),
        targetValid,
        bookingData: booking
      })
      
      if (!originalValid || !targetValid) {
        const errorDetails = {
          originalScheduledAt: booking.scheduled_at,
          originalDateType: typeof booking.scheduled_at,
          originalDateValid: originalValid,
          originalDateValue: originalDate.toString(),
          targetDateValid: targetValid,
          targetDateValue: targetDate.toString(),
          targetDateType: typeof targetDate,
          dropData: dropData,
          bookingId: booking.id
        }
        console.error('Invalid dates in drag and drop:', errorDetails)
        alert(`Er is een fout opgetreden: ongeldige datum\nOrigineel: ${originalValid ? 'OK' : 'FOUT'}\nDoel: ${targetValid ? 'OK' : 'FOUT'}`)
        return
      }
      
      const newDate = new Date(targetDate)
      
      // For week view time slots, use the target hour from the drop zone
      // For month view, keep the original time
      const dropZoneId = over.id.toString()
      const isTimeSlotDrop = dropZoneId.startsWith('drop-')
      
      console.log('Drop zone analysis:', { dropZoneId, isTimeSlotDrop, dropData })
      
      if (isTimeSlotDrop) {
        // This is a time slot drop in week view - use the data from the drop zone
        if (dropData.hour !== undefined && dropData.minutes !== undefined) {
          console.log('Using drop zone data:', { hour: dropData.hour, minutes: dropData.minutes })
          newDate.setHours(dropData.hour)
          newDate.setMinutes(dropData.minutes)
        } else {
          // Fallback to parsing the ID
          const parts = dropZoneId.replace('drop-', '').split('-')
          if (parts.length >= 4) {
            const hourFromDropZone = parseInt(parts[3] || '0')
            const minutesFromDropZone = parts.length === 5 ? parseInt(parts[4] || '0') : 0
            console.log('Parsed from ID:', { hour: hourFromDropZone, minutes: minutesFromDropZone })
            newDate.setHours(hourFromDropZone)
            newDate.setMinutes(minutesFromDropZone)
          }
        }
      } else {
        // This is a day drop (month view), keep the original time
        newDate.setHours(originalDate.getHours())
        newDate.setMinutes(originalDate.getMinutes())
      }
      
      newDate.setSeconds(0)
      newDate.setMilliseconds(0)

      console.log('Date calculation:', {
        original: originalDate.toISOString(),
        new: newDate.toISOString(),
        originalTime: originalDate.getTime(),
        newTime: newDate.getTime(),
        timeDiff: newDate.getTime() - originalDate.getTime(),
        changed: newDate.getTime() !== originalDate.getTime()
      })

      // Only update if the date/time actually changed
      if (newDate.getTime() !== originalDate.getTime()) {
        console.log('Updating booking...')
        
        try {
          await updateBookingMutation.mutateAsync({
            id: booking.id,
            updates: {
              scheduled_at: newDate.toISOString()
            }
          })
          
          // Show success feedback
          console.log('Booking successfully moved!')
          
        } catch (updateError) {
          console.error('Failed to update booking:', updateError)
          // Show user-friendly error
          alert('Er is een fout opgetreden bij het verplaatsen van de afspraak. Probeer het opnieuw.')
          throw updateError // Re-throw to trigger error handling
        }
      } else {
        console.log('No change detected, skipping update')
      }
    } catch (error) {
      console.error('Error moving booking:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        bookingId: booking?.id,
        originalTime: booking?.scheduled_at,
        dropData: dropData,
        dropZoneId: over?.id
      })
      alert('Er is een fout opgetreden bij het verplaatsen van de afspraak')
    }
  }

  // Modal handlers
  const openModalForNew = (date?: Date) => {
    setSelectedBookingId(null)
    setInitialModalDate(date)
    setIsModalOpen(true)
  }

  const openModalForEdit = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setInitialModalDate(undefined)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBookingId(null)
    setInitialModalDate(undefined)
  }

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Days of week header - only for month view */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
                <div
                  key={day}
                  className={`px-2 py-3 text-sm font-medium text-center ${
                    index === 5 || index === 6 ? 'text-gray-500' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Calendar grid */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'month' ? (
              <div className="grid grid-cols-7">
                {calendarDays.map((date) => {
                  const dateKey = format(date, 'yyyy-MM-dd')
                  const dayBookings = bookingsByDate[dateKey] || []
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()

                  return (
                    <CalendarCell
                      key={dateKey}
                      date={date}
                      bookings={dayBookings}
                      onDrop={() => {}}
                      onEmptyClick={openModalForNew}
                      onBookingClick={openModalForEdit}
                    />
                  )
                })}
              </div>
            ) : (
              <WeekView 
                weekDays={calendarDays.slice(0, 7)}
                bookingsByDate={bookingsByDate}
                onEmptyClick={openModalForNew}
                onBookingClick={openModalForEdit}
              />
            )}
          </div>

          <DragOverlay>
            {draggedBooking && (
              <div className="shadow-2xl rounded-lg opacity-90 transform rotate-2 scale-105 pointer-events-none">
                <DraggableAppointment
                  booking={draggedBooking}
                  onClick={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add appointment button */}
      <button
        onClick={() => openModalForNew()}
        className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#02011F] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all z-20"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Booking Modal */}
      {isModalOpen && (
        <BookingFormModal
          bookingId={selectedBookingId}
          initialDate={initialModalDate}
          onClose={closeModal}
        />
      )}

      {/* Hover Preview - Only on non-touch devices */}
      {hoveredBooking && !('ontouchstart' in window) && (
        <AppointmentHoverPreview
          booking={hoveredBooking.booking}
          position={hoveredBooking.position}
        />
      )}
    </div>
  )
}