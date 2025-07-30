'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, getDay, differenceInDays } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useBookings, useUpdateBooking, Booking } from '@/lib/hooks/useBookings'
import { BookingFormModal } from './BookingFormModal'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, Plus, MoreHorizontal, GripVertical, Phone, Mail, Euro, Star } from 'lucide-react'
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { atom, useAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import { calculateAppointmentPositions, AppointmentWithOverlap } from '@/lib/utils/appointment-overlap'

interface KiboCalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  filters?: {
    searchTerm: string
    status: string
    service: string
    staff: string
    date: string
  }
}

// Jotai atoms for state management
export const viewModeAtom = atom<'week' | 'month'>('month')
export const currentDateAtom = atom(new Date())
const selectedBookingAtom = atom<string | null>(null)
const draggedBookingAtom = atom<Booking | null>(null)
const hoveredBookingAtom = atom<{ 
  booking: Booking; 
  position: { 
    x: number; 
    y: number; 
    horizontalAlignment?: 'left' | 'right' | 'center';
    verticalAlignment?: 'above' | 'below' | 'center';
    rect?: {
      width: number;
      height: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
  } 
} | null>(null)
const resizePreviewAtom = atom<{
  booking: Booking;
  newStartTime?: Date;
  newDuration?: number;
  type: 'resize-top' | 'resize-bottom';
} | null>(null)

// Color mapping for payment status
const paymentColors = {
  paid: {
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    modalBorder: 'border-emerald-300',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    accent: 'text-emerald-700'
  },
  unpaid: {
    bg: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    modalBorder: 'border-gray-300',
    headerBg: 'bg-gray-50',
    headerBorder: 'border-gray-200',
    accent: 'text-gray-700'
  }
}

// Hover preview component
function AppointmentHoverPreview({ booking, position }: { 
  booking: Booking; 
  position: { 
    x: number; 
    y: number;
    horizontalAlignment?: 'left' | 'right' | 'center';
    verticalAlignment?: 'above' | 'below' | 'center';
    rect?: {
      width: number;
      height: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
  } 
}) {
  const paymentStatus = booking.is_paid ? 'paid' : 'unpaid'
  const colors = paymentColors[paymentStatus]
  
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

  // Calculate optimal positioning based on smart positioning data
  const getPositioningStyles = () => {
    const horizontalAlignment = position.horizontalAlignment || 'right'
    const verticalAlignment = position.verticalAlignment || 'above'
    const margin = 10
    
    let styles: React.CSSProperties = {}
    
    // Horizontal positioning
    if (horizontalAlignment === 'left') {
      styles.right = `${window.innerWidth - position.rect!.left + margin}px`
    } else if (horizontalAlignment === 'center') {
      styles.left = `${position.rect!.left + position.rect!.width / 2}px`
      styles.transform = 'translateX(-50%)'
    } else {
      // Default 'right' positioning
      styles.left = `${position.rect!.right + margin}px`
    }
    
    // Vertical positioning
    if (verticalAlignment === 'above') {
      styles.bottom = `${window.innerHeight - position.rect!.top + margin}px`
    } else if (verticalAlignment === 'below') {
      styles.top = `${position.rect!.bottom + margin}px`
    } else {
      // Center vertically
      styles.top = `${position.rect!.top + position.rect!.height / 2}px`
      styles.transform = (styles.transform || '') + ' translateY(-50%)'
    }
    
    return styles
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={getPositioningStyles()}
    >
      
      <div className={`bg-white rounded-xl shadow-2xl border-2 p-4 w-80 ${colors.modalBorder}`}>
        {/* Header */}
        <div className={`rounded-lg p-3 mb-3 ${colors.headerBg} ${colors.headerBorder} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
              <span className={`font-semibold ${colors.accent}`}>
                {paymentStatus === 'paid' ? 'Betaald' : 'Nog niet betaald'}
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

    </div>
  )
}

// Resize preview component
function ResizePreview({ booking, type, previewTime, previewDuration }: {
  booking: Booking;
  type: 'resize-top' | 'resize-bottom';
  previewTime?: Date;
  previewDuration?: number;
}) {
  const originalDate = new Date(booking.scheduled_at)
  const originalDuration = booking.duration_minutes || 60
  
  // Calculate the preview dimensions
  const startTime = type === 'resize-top' && previewTime ? previewTime : originalDate
  const duration = type === 'resize-bottom' && previewDuration ? previewDuration : 
                   type === 'resize-top' && previewTime ? 
                     Math.max(15, Math.round((originalDate.getTime() + originalDuration * 60000 - previewTime.getTime()) / 60000)) :
                     originalDuration
  
  const startHour = startTime.getHours()
  const startMinutes = startTime.getMinutes()
  const topPosition = ((startHour - 7) * 64) + (startMinutes / 60 * 64) // 7am start, 64px per hour
  const height = (duration / 60) * 64
  
  return (
    <div 
      className="absolute left-1 right-1 bg-blue-200 border-2 border-blue-500 rounded-lg opacity-50 pointer-events-none z-40 transition-none"
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
      }}
    >
      <div className="p-1 text-xs font-medium text-blue-900">
        {format(startTime, 'HH:mm')} - {format(new Date(startTime.getTime() + duration * 60000), 'HH:mm')}
        <span className="ml-1">({duration} min)</span>
      </div>
    </div>
  )
}

// Compact appointment card for month view with multiple appointments
function CompactAppointmentCard({ booking, onClick, viewMode = 'month' }: { booking: Booking; onClick: () => void; viewMode?: 'week' | 'month' }) {
  const paymentStatus = booking.is_paid ? 'paid' : 'unpaid'
  const colors = paymentColors[paymentStatus]
  
  const scheduledDate = new Date(booking.scheduled_at)
  const isValidDate = scheduledDate instanceof Date && !isNaN(scheduledDate.getTime())
  const time = isValidDate ? format(scheduledDate, 'HH:mm') : '00:00'
  
  const clientName = booking.clients?.first_name || 'Onbekend'
  
  // Add drag functionality
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: {
      type: 'move',
      booking: booking
    }
  })
  
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`group relative p-1 rounded border text-xs cursor-pointer transition-all overflow-hidden ${colors.bg} ${colors.text} ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
        <span className="font-medium flex-shrink-0">{time}</span>
        <span className="truncate opacity-90 min-w-0" title={clientName}>{clientName}</span>
      </div>
      
      {/* Drag handle for touch devices */}
      <div 
        {...listeners}
        className={`absolute top-0 right-0 flex items-center justify-center cursor-move transition-opacity
          ${isTouchDevice 
            ? 'w-4 h-4 opacity-40' 
            : 'w-3 h-3 opacity-0 group-hover:opacity-60 hover:!opacity-100'
          }`}
        style={{ touchAction: 'manipulation' }}
        title="Sleep om te verplaatsen"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className={`${isTouchDevice ? 'w-2 h-2' : 'w-2 h-2'} text-gray-600`} />
      </div>
    </div>
  )
}

// Draggable appointment card
function DraggableAppointment({ booking, onClick, compact = false, viewMode = 'month', isOverlapping = false }: { booking: Booking; onClick: () => void; compact?: boolean; viewMode?: 'week' | 'month'; isOverlapping?: boolean }) {
  const [hoveredBooking, setHoveredBooking] = useAtom(hoveredBookingAtom)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  // Main draggable for moving appointments
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: {
      type: 'move',
      booking: booking
    }
  })

  // Top resize handle
  const { 
    attributes: topResizeAttributes, 
    listeners: topResizeListeners, 
    setNodeRef: setTopResizeNodeRef,
    transform: topResizeTransform,
    isDragging: isTopResizing
  } = useDraggable({
    id: `${booking.id}-resize-top`,
    data: {
      type: 'resize-top',
      booking: booking
    }
  })

  // Bottom resize handle
  const { 
    attributes: bottomResizeAttributes, 
    listeners: bottomResizeListeners, 
    setNodeRef: setBottomResizeNodeRef,
    transform: bottomResizeTransform,
    isDragging: isBottomResizing
  } = useDraggable({
    id: `${booking.id}-resize-bottom`,
    data: {
      type: 'resize-bottom',
      booking: booking
    }
  })

  // Only apply transform for move operations, not resize
  const style = transform && !isTopResizing && !isBottomResizing ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  // Visual feedback for resizing
  const isResizing = isTopResizing || isBottomResizing
  const resizeStyles = isResizing ? {
    boxShadow: '0 0 0 2px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.3)',
    zIndex: 50,
    transition: 'none' // Disable transitions during resize
  } : {}

  const paymentStatus = booking.is_paid ? 'paid' : 'unpaid'
  const colors = paymentColors[paymentStatus]
  
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
      const menuWidth = 320 // w-80 in Tailwind
      const menuHeight = 450 // Approximate height of the hover menu
      const margin = 15
      
      // Calculate available space
      const rightSpace = window.innerWidth - rect.right
      const leftSpace = rect.left
      const topSpace = rect.top
      const bottomSpace = window.innerHeight - rect.bottom
      
      // Determine optimal horizontal position
      let horizontalAlignment: 'left' | 'right' | 'center' = 'right'
      
      if (rightSpace < menuWidth + margin && leftSpace >= menuWidth + margin) {
        // Not enough space on right, but enough on left
        horizontalAlignment = 'left'
      } else if (rightSpace < menuWidth + margin && leftSpace < menuWidth + margin) {
        // Not enough space on either side, center it
        horizontalAlignment = 'center'
      }
      
      // Determine optimal vertical position
      let verticalAlignment: 'above' | 'below' | 'center' = 'center'
      
      // Priority: 1. Side positioning if horizontal space allows
      // 2. Above if bottom space insufficient
      // 3. Below if top space insufficient
      
      if (horizontalAlignment !== 'center') {
        // Side positioning - check if we need to adjust vertical
        if (topSpace < menuHeight / 2 && bottomSpace >= menuHeight / 2) {
          // Too close to top, align with top of appointment
          verticalAlignment = 'center'
        } else if (bottomSpace < menuHeight / 2 && topSpace >= menuHeight / 2) {
          // Too close to bottom, align with bottom of appointment
          verticalAlignment = 'center'
        }
      } else {
        // Center horizontal - must position above or below
        if (bottomSpace < menuHeight + margin) {
          verticalAlignment = 'above'
        } else {
          verticalAlignment = 'below'
        }
      }
      
      // If appointment is near bottom and we can't fit menu anywhere
      if (bottomSpace < menuHeight + margin && topSpace >= menuHeight + margin) {
        verticalAlignment = 'above'
        // Force horizontal center if needed for vertical space
        if (horizontalAlignment !== 'center' && bottomSpace < 100) {
          horizontalAlignment = 'center'
        }
      }
      
      setHoveredBooking({
        booking,
        position: {
          x: 0, // Not used anymore, keeping for compatibility
          y: 0, // Not used anymore, keeping for compatibility
          horizontalAlignment,
          verticalAlignment,
          rect: {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom
          }
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
      style={{...style, ...resizeStyles}}
      {...attributes}
      className={`group relative ${isOverlapping ? 'p-0.5 sm:p-1' : 'p-1 sm:p-2'} rounded-lg border transition-all h-full ${colors.bg} ${colors.text} ${isResizing ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top resize handle - only show in week view */}
      {viewMode === 'week' && (
        <div
          ref={setTopResizeNodeRef}
          {...topResizeAttributes}
          {...topResizeListeners}
          className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-2 cursor-ns-resize transition-opacity z-20
            ${isTouchDevice 
              ? 'opacity-30 bg-blue-500 rounded-b-md' 
              : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 bg-blue-400 rounded-b-md'
            }`}
          style={{ touchAction: 'manipulation' }}
          title="Sleep om starttijd aan te passen"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Bottom resize handle - only show in week view */}
      {viewMode === 'week' && (
        <div
          ref={setBottomResizeNodeRef}
          {...bottomResizeAttributes}
          {...bottomResizeListeners}
          className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-2 cursor-ns-resize transition-opacity z-20
            ${isTouchDevice 
              ? 'opacity-30 bg-blue-500 rounded-t-md' 
              : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 bg-blue-400 rounded-t-md'
            }`}
          style={{ touchAction: 'manipulation' }}
          title="Sleep om eindtijd aan te passen"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Clickable content area */}
      <div onClick={handleClick} className="flex items-start gap-1 sm:gap-2 w-full cursor-pointer relative overflow-hidden">
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1 sm:mt-1.5 flex-shrink-0 ${colors.dot}`} />
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Compact view for 30min appointments or overlapping */}
          {(booking.duration_minutes && booking.duration_minutes <= 30) || isOverlapping ? (
            <div className="flex items-center gap-1 overflow-hidden">
              <span className={`font-medium ${isOverlapping ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} flex-shrink-0`}>{time}</span>
              <span className={`${isOverlapping ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} opacity-75 flex-shrink-0`}>{booking.duration_minutes || 60}min</span>
              <span className={`${isOverlapping ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} truncate opacity-90 min-w-0`} title={clientName}>{clientName}</span>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-medium text-xs sm:text-sm flex-shrink-0">{time}</span>
                <span className="text-[10px] sm:text-xs opacity-75 hidden sm:inline flex-shrink-0">
                  {booking.duration_minutes || 60}min
                </span>
              </div>
              <div className="text-[11px] sm:text-xs mt-0.5 truncate opacity-90" title={clientName}>{clientName}</div>
              <div className="text-[10px] sm:text-xs truncate opacity-75 hidden sm:block" title={serviceName}>{serviceName}</div>
              {booking.duration_minutes && booking.duration_minutes > 90 && (
                <div className="text-[10px] sm:text-xs text-orange-600 font-medium truncate" title={`Lange behandeling (${Math.round(booking.duration_minutes / 60 * 10) / 10} uur)`}>
                  Lang ({Math.round(booking.duration_minutes / 60 * 10) / 10}u)
                </div>
              )}
            </div>
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
          style={{ touchAction: 'manipulation' }}
          title="Sleep om te verplaatsen"
          onClick={(e) => e.stopPropagation()}
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
  const [resizePreview] = useAtom(resizePreviewAtom)
  
  // Calculate overlapping positions for bookings in this hour
  const bookingsWithPositions = useMemo(() => {
    if (bookings.length === 0) return []
    
    // Convert bookings to AppointmentWithOverlap format
    const appointmentsData: AppointmentWithOverlap[] = bookings.map(booking => ({
      id: booking.id,
      scheduled_at: booking.scheduled_at,
      duration_minutes: booking.duration_minutes || 60,
      booking
    }))
    
    // Calculate positions for overlapping appointments
    return calculateAppointmentPositions(appointmentsData)
  }, [bookings])

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
      {bookingsWithPositions.map((appointment) => {
        const booking = (appointment as any).booking as Booking
        const position = appointment.position!
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
        
        // Calculate horizontal position based on overlap
        const leftPercent = position.left
        const widthPercent = position.width
        
        // Check if this booking is being resized
        const isBeingResized = resizePreview && resizePreview.booking.id === booking.id
        
        return (
          <div
            key={booking.id}
            className="absolute z-10 overflow-hidden"
            style={{
              top: `${topPixels}px`,
              height: `${heightPixels}px`,
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              paddingRight: position.totalColumns > 1 ? '2px' : '0',
              opacity: isBeingResized ? 0.3 : 1 // Make original appointment semi-transparent during resize
            }}
          >
            <DraggableAppointment
              booking={booking}
              onClick={() => onBookingClick(booking.id)}
              viewMode="week"
              isOverlapping={position.totalColumns > 1}
            />
          </div>
        )
      })}
      
      {/* Render resize preview if applicable to this hour */}
      {resizePreview && (() => {
        const previewStartTime = resizePreview.type === 'resize-top' && resizePreview.newStartTime ? 
          resizePreview.newStartTime : new Date(resizePreview.booking.scheduled_at)
        const previewDuration = resizePreview.type === 'resize-bottom' && resizePreview.newDuration ? 
          resizePreview.newDuration : resizePreview.booking.duration_minutes || 60
        
        const previewStartHour = previewStartTime.getHours()
        const previewEndTime = new Date(previewStartTime.getTime() + previewDuration * 60000)
        const previewEndHour = previewEndTime.getHours()
        
        // Check if preview overlaps with this hour
        if ((previewStartHour === hour || (previewStartHour < hour && previewEndHour >= hour)) && 
            isSameDay(date, previewStartTime)) {
          
          // Calculate position relative to this hour
          let topInHour = 0
          let heightInHour = 64 // Full hour height
          
          if (previewStartHour === hour) {
            // Preview starts in this hour
            topInHour = (previewStartTime.getMinutes() / 60) * HOUR_HEIGHT
            const remainingMinutesInHour = 60 - previewStartTime.getMinutes()
            heightInHour = Math.min((previewDuration / 60) * HOUR_HEIGHT, (remainingMinutesInHour / 60) * HOUR_HEIGHT)
          } else if (previewStartHour < hour) {
            // Preview continues from previous hour
            const minutesFromStart = (hour - previewStartHour) * 60 - previewStartTime.getMinutes()
            const remainingDuration = previewDuration - minutesFromStart
            heightInHour = Math.min((remainingDuration / 60) * HOUR_HEIGHT, HOUR_HEIGHT)
          }
          
          return (
            <div 
              className="absolute left-1 right-1 bg-blue-200 border-2 border-blue-500 rounded-lg opacity-50 pointer-events-none z-30"
              style={{
                top: `${topInHour}px`,
                height: `${heightInHour}px`,
              }}
            >
              {previewStartHour === hour && (
                <div className="p-1 text-xs font-medium text-blue-900">
                  {format(previewStartTime, 'HH:mm')} - {format(previewEndTime, 'HH:mm')}
                  <span className="ml-1">({previewDuration} min)</span>
                </div>
              )}
            </div>
          )
        }
        return null
      })()}
    </div>
  )
}

// Droppable calendar cell
function CalendarCell({ date, bookings, onDrop, onEmptyClick, onBookingClick, isCurrentMonth = true }: { 
  date: Date; 
  bookings: Booking[]; 
  onDrop: (date: Date) => void;
  onEmptyClick: (date: Date) => void;
  onBookingClick: (bookingId: string) => void;
  isCurrentMonth?: boolean;
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
        ${isCurrentDay ? 'bg-blue-50/30' : isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100/70 hover:bg-gray-150/80'}
        ${isOver ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}
        ${!isCurrentMonth ? 'shadow-lg shadow-gray-400/30 opacity-60' : ''}
        transition-all cursor-pointer
      `}
    >
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className={`text-xs sm:text-sm font-medium ${
          isCurrentDay ? 'text-primary-700' : 
          isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
        }`}>
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
                viewMode="month"
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
              viewMode="month"
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
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        {/* Mobile: Stack elements vertically */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 capitalize">{displayText}</h2>
          
          {/* Mobile: Show view mode toggle on the right */}
          <div className="flex sm:hidden bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all min-h-[32px] ${
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

export function KiboCalendarView({ selectedDate, onDateSelect, filters }: KiboCalendarViewProps) {
  const [viewMode, setViewMode] = useAtom(viewModeAtom)
  const [currentDate, setCurrentDate] = useAtom(currentDateAtom)
  const [draggedBooking, setDraggedBooking] = useAtom(draggedBookingAtom)
  const [hoveredBooking, setHoveredBooking] = useAtom(hoveredBookingAtom)
  const [resizePreview, setResizePreview] = useAtom(resizePreviewAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [initialModalDate, setInitialModalDate] = useState<Date | undefined>()

  // Configure sensors for mobile drag and drop support
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // Require 10px movement before activating (desktop only)
    },
  })
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms hold before drag starts (mobile)
      tolerance: 5, // Allow 5px movement while holding
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  const queryClient = useQueryClient()
  const updateBookingMutation = useUpdateBooking()

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday = 1
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return { start, end }
    } else {
      // For month view, calculate adaptive grid (5-6 weeks based on month layout)
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      // Find first Monday of the calendar grid (may be in previous month)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      
      // Find last Sunday that includes the month end
      const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      // Calculate weeks needed and cap at 6 weeks maximum
      const daysSpanned = differenceInDays(lastWeekEnd, calendarStart) + 1
      const weeksNeeded = Math.ceil(daysSpanned / 7)
      const maxWeeks = Math.min(6, weeksNeeded)
      
      // Calculate final end date based on optimal weeks
      const calendarEnd = new Date(calendarStart.getTime() + ((maxWeeks * 7) - 1) * 24 * 60 * 60 * 1000)
      
      return { start: calendarStart, end: calendarEnd }
    }
  }, [currentDate, viewMode])

  // Fetch bookings with filters
  const { data: bookings = [], isLoading } = useBookings(
    dateRange.start.toISOString(),
    dateRange.end.toISOString(),
    filters
  )

  // Generate calendar days
  const calendarDays = useMemo(() => {
    // dateRange now includes all needed days (including padding for month view)
    return eachDayOfInterval(dateRange)
  }, [dateRange])

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
    const dragType = event.active.data.current?.type || event.active.data?.type || 'move'
    
    console.log('Drag start:', {
      activeId: event.active.id,
      dragType: dragType,
      activeCurrent: event.active.data.current,
      activeData: event.active.data,
      booking: booking,
      bookingId: booking?.id,
      scheduledAt: booking?.scheduled_at,
      hasValidDate: booking?.scheduled_at ? !isNaN(new Date(booking.scheduled_at).getTime()) : false
    })
    
    if (dragType === 'move') {
      setDraggedBooking(booking)
    } else if ((dragType === 'resize-top' || dragType === 'resize-bottom') && booking) {
      setResizePreview({
        booking,
        type: dragType
      })
    }
  }

  const handleDragMove = (event: any) => {
    const { active, over } = event
    
    if (!over || !active.data || !resizePreview) return
    
    const dragType = active.data.current?.type || active.data?.type || 'move'
    
    if (dragType === 'resize-top' || dragType === 'resize-bottom') {
      const dropData = over.data.current
      if (!dropData || !dropData.date) return
      
      let targetDate: Date
      if (dropData.date instanceof Date) {
        targetDate = new Date(dropData.date.getTime())
      } else if (typeof dropData.date === 'string') {
        targetDate = new Date(dropData.date)
      } else {
        return
      }
      
      if (dropData.hour !== undefined && dropData.minutes !== undefined) {
        targetDate.setHours(dropData.hour)
        targetDate.setMinutes(dropData.minutes)
      }
      
      // Round to nearest 15 minutes
      const minutes = targetDate.getMinutes()
      const roundedMinutes = Math.round(minutes / 15) * 15
      targetDate.setMinutes(roundedMinutes)
      targetDate.setSeconds(0)
      targetDate.setMilliseconds(0)
      
      if (dragType === 'resize-top') {
        setResizePreview({
          ...resizePreview,
          newStartTime: targetDate
        })
      } else if (dragType === 'resize-bottom') {
        const originalDate = new Date(resizePreview.booking.scheduled_at)
        const newDuration = Math.max(15, Math.round((targetDate.getTime() - originalDate.getTime()) / 60000))
        setResizePreview({
          ...resizePreview,
          newDuration: Math.min(480, newDuration) // Max 8 hours
        })
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedBooking(null)
    setResizePreview(null)

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
    const dragType = active.data.current?.type || active.data?.type || 'move'
    
    console.log('Debug booking data:', {
      dragType: dragType,
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
      const originalDuration = booking.duration_minutes || 60
      
      // Enhanced validation with detailed logging
      const originalValid = originalDate instanceof Date && !isNaN(originalDate.getTime())
      const targetValid = targetDate instanceof Date && !isNaN(targetDate.getTime())
      
      console.log('Date validation:', {
        dragType: dragType,
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

      let newScheduledAt: Date
      let newDuration: number = originalDuration
      let updates: any = {}
      
      // Handle different drag types
      if (dragType === 'resize-top') {
        // Resizing from the top - changing start time
        const dropZoneId = over.id.toString()
        const isTimeSlotDrop = dropZoneId.startsWith('drop-')
        
        if (isTimeSlotDrop) {
          // Calculate new start time from drop zone
          newScheduledAt = new Date(targetDate)
          if (dropData.hour !== undefined && dropData.minutes !== undefined) {
            newScheduledAt.setHours(dropData.hour)
            newScheduledAt.setMinutes(dropData.minutes)
          }
          
          // Round to nearest 15 minutes
          const minutes = newScheduledAt.getMinutes()
          const roundedMinutes = Math.round(minutes / 15) * 15
          newScheduledAt.setMinutes(roundedMinutes)
          newScheduledAt.setSeconds(0)
          newScheduledAt.setMilliseconds(0)
          
          // Calculate new duration (end time stays the same)
          const originalEndTime = new Date(originalDate.getTime() + originalDuration * 60000)
          newDuration = Math.max(15, Math.round((originalEndTime.getTime() - newScheduledAt.getTime()) / 60000))
          
          // Ensure minimum 15 minutes and maximum 8 hours
          newDuration = Math.max(15, Math.min(480, newDuration))
          
          updates = {
            scheduled_at: newScheduledAt.toISOString(),
            duration_minutes: newDuration
          }
        } else {
          return // Can't resize on non-time slots
        }
        
      } else if (dragType === 'resize-bottom') {
        // Resizing from the bottom - changing end time (duration)
        const dropZoneId = over.id.toString()
        const isTimeSlotDrop = dropZoneId.startsWith('drop-')
        
        if (isTimeSlotDrop) {
          // Calculate new end time from drop zone
          const newEndTime = new Date(targetDate)
          if (dropData.hour !== undefined && dropData.minutes !== undefined) {
            newEndTime.setHours(dropData.hour)
            newEndTime.setMinutes(dropData.minutes)
          }
          
          // Round to nearest 15 minutes
          const minutes = newEndTime.getMinutes()
          const roundedMinutes = Math.round(minutes / 15) * 15
          newEndTime.setMinutes(roundedMinutes)
          newEndTime.setSeconds(0)
          newEndTime.setMilliseconds(0)
          
          // Calculate new duration (start time stays the same)
          newDuration = Math.max(15, Math.round((newEndTime.getTime() - originalDate.getTime()) / 60000))
          
          // Ensure minimum 15 minutes and maximum 8 hours
          newDuration = Math.max(15, Math.min(480, newDuration))
          
          newScheduledAt = originalDate
          updates = {
            duration_minutes: newDuration
          }
        } else {
          return // Can't resize on non-time slots
        }
        
      } else {
        // Regular move operation
        newScheduledAt = new Date(targetDate)
        
        // For week view time slots, use the target hour from the drop zone
        // For month view, keep the original time
        const dropZoneId = over.id.toString()
        const isTimeSlotDrop = dropZoneId.startsWith('drop-')
        
        console.log('Drop zone analysis:', { dropZoneId, isTimeSlotDrop, dropData })
        
        if (isTimeSlotDrop) {
          // This is a time slot drop in week view - use the data from the drop zone
          if (dropData.hour !== undefined && dropData.minutes !== undefined) {
            console.log('Using drop zone data:', { hour: dropData.hour, minutes: dropData.minutes })
            newScheduledAt.setHours(dropData.hour)
            newScheduledAt.setMinutes(dropData.minutes)
          } else {
            // Fallback to parsing the ID
            const parts = dropZoneId.replace('drop-', '').split('-')
            if (parts.length >= 4) {
              const hourFromDropZone = parseInt(parts[3] || '0')
              const minutesFromDropZone = parts.length === 5 ? parseInt(parts[4] || '0') : 0
              console.log('Parsed from ID:', { hour: hourFromDropZone, minutes: minutesFromDropZone })
              newScheduledAt.setHours(hourFromDropZone)
              newScheduledAt.setMinutes(minutesFromDropZone)
            }
          }
        } else {
          // This is a day drop (month view), keep the original time
          newScheduledAt.setHours(originalDate.getHours())
          newScheduledAt.setMinutes(originalDate.getMinutes())
        }
        
        newScheduledAt.setSeconds(0)
        newScheduledAt.setMilliseconds(0)
        
        updates = {
          scheduled_at: newScheduledAt.toISOString()
        }
      }

      console.log('Update calculation:', {
        dragType: dragType,
        originalTime: originalDate.toISOString(),
        originalDuration: originalDuration,
        newTime: newScheduledAt?.toISOString(),
        newDuration: newDuration,
        updates: updates,
        changed: Object.keys(updates).length > 0
      })

      // Only update if something actually changed
      const hasChanges = Object.keys(updates).some(key => {
        if (key === 'scheduled_at') {
          return updates[key] !== booking.scheduled_at
        } else if (key === 'duration_minutes') {
          return updates[key] !== booking.duration_minutes
        }
        return true
      })

      if (hasChanges) {
        console.log('Updating booking...', updates)
        
        try {
          await updateBookingMutation.mutateAsync({
            id: booking.id,
            updates: updates
          })
          
          // Show success feedback
          console.log('Booking successfully updated!')
          
        } catch (updateError) {
          console.error('Failed to update booking:', updateError)
          // Show user-friendly error
          alert('Er is een fout opgetreden bij het aanpassen van de afspraak. Probeer het opnieuw.')
          throw updateError // Re-throw to trigger error handling
        }
      } else {
        console.log('No change detected, skipping update')
      }
    } catch (error) {
      console.error('Error updating booking:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        bookingId: booking?.id,
        originalTime: booking?.scheduled_at,
        dropData: dropData,
        dropZoneId: over?.id,
        dragType: dragType
      })
      alert('Er is een fout opgetreden bij het aanpassen van de afspraak')
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

      <div className="flex-1 bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden flex flex-col">
        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* Days of week header - only for month view */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
                <div
                  key={day}
                  className={`px-1 sm:px-2 py-2 sm:py-3 text-xs sm:text-sm font-medium text-center ${
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
                      isCurrentMonth={isCurrentMonth}
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
            {draggedBooking && !resizePreview && (
              <div className="shadow-2xl rounded-lg opacity-90 transform rotate-2 scale-105 pointer-events-none">
                <DraggableAppointment
                  booking={draggedBooking}
                  onClick={() => {}}
                  viewMode={viewMode}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add appointment button */}
      <button
        onClick={() => openModalForNew()}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#02011F] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 active:scale-95 transition-all z-20"
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