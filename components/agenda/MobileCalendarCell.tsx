'use client'

import { format, isToday } from 'date-fns'
import { Booking } from '@/lib/hooks/useBookings'
import { Plus } from 'lucide-react'

interface MobileCalendarCellProps {
  date: Date
  bookings: Booking[]
  onDayClick: (date: Date) => void
  isCurrentMonth?: boolean
  availabilityStatus?: 'available' | 'limited' | 'unavailable'
  showAvailabilityIndicator?: boolean
}

export function MobileCalendarCell({
  date,
  bookings,
  onDayClick,
  isCurrentMonth = true,
  availabilityStatus = 'available',
  showAvailabilityIndicator = false
}: MobileCalendarCellProps) {
  const isCurrentDay = isToday(date)
  const dayNumber = format(date, 'd')
  
  // Group bookings by payment status for dot display
  const paidBookings = bookings.filter(b => b.is_paid)
  const unpaidBookings = bookings.filter(b => !b.is_paid)
  
  // Calculate max dots to show (max 3)
  const maxDots = 3
  const totalBookings = bookings.length
  const showCount = totalBookings > maxDots
  
  // Get availability styling
  const getAvailabilityStyles = () => {
    if (!showAvailabilityIndicator) return ''
    
    switch (availabilityStatus) {
      case 'unavailable':
        return 'bg-red-50/30 border-red-100'
      case 'limited':
        return 'bg-amber-50/30 border-amber-100'
      default:
        return ''
    }
  }

  return (
    <div
      onClick={() => onDayClick(date)}
      className={`
        relative min-h-[60px] p-1 border-r border-b border-gray-200
        ${isCurrentDay ? 'bg-blue-50/50' : isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
        ${!isCurrentMonth ? 'opacity-60' : ''}
        ${getAvailabilityStyles()}
        active:bg-gray-100 transition-colors cursor-pointer
      `}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          isCurrentDay ? 'text-primary-700' : 
          isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
        }`}>
          {dayNumber}
        </span>
        
        {/* Availability indicator */}
        {showAvailabilityIndicator && availabilityStatus !== 'available' && (
          <div className={`w-1.5 h-1.5 rounded-full ${
            availabilityStatus === 'unavailable' ? 'bg-red-500' :
            'bg-amber-500'
          }`} />
        )}
      </div>

      {/* Appointment dots */}
      {bookings.length > 0 && (
        <div className="flex flex-col items-center justify-center flex-1 space-y-0.5">
          <div className="flex items-center justify-center gap-0.5">
            {/* Show paid bookings first (green dots) */}
            {paidBookings.slice(0, maxDots).map((_, index) => (
              <div
                key={`paid-${index}`}
                className="w-1.5 h-1.5 bg-green-500 rounded-full"
              />
            ))}
            
            {/* Then unpaid bookings (gray dots) */}
            {unpaidBookings.slice(0, Math.max(0, maxDots - paidBookings.length)).map((_, index) => (
              <div
                key={`unpaid-${index}`}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
              />
            ))}
          </div>
          
          {/* Count indicator if more than max dots */}
          {showCount && (
            <span className="text-[10px] text-gray-600 font-medium">
              {totalBookings}
            </span>
          )}
        </div>
      )}
    </div>
  )
}