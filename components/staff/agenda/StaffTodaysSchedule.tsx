'use client'

import { format, isAfter, isBefore } from 'date-fns'
import { nl } from 'date-fns/locale'
import { StaffBookingWithRelations } from '@/lib/services/staffBookingService'
import { useStaffAuth } from '@/lib/hooks/useStaffAuth'
import { Calendar, Clock, User, Phone, Euro, MapPin } from 'lucide-react'

interface StaffTodaysScheduleProps {
  bookings: StaffBookingWithRelations[]
  onBookingSelect: (booking: StaffBookingWithRelations) => void
  selectedBooking: StaffBookingWithRelations | null
}

export function StaffTodaysSchedule({ 
  bookings, 
  onBookingSelect, 
  selectedBooking 
}: StaffTodaysScheduleProps) {
  const { user } = useStaffAuth()
  const now = new Date()

  // Sort bookings by time
  const sortedBookings = [...bookings].sort((a, b) => {
    if (!a.scheduled_at || !b.scheduled_at) return 0
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })

  // Separate past, current, and future appointments
  const { pastBookings, currentBookings, futureBookings } = sortedBookings.reduce((acc, booking) => {
    if (!booking.scheduled_at) return acc
    
    const bookingStart = new Date(booking.scheduled_at)
    const duration = booking.services?.duration_minutes || 60
    const bookingEnd = new Date(bookingStart.getTime() + duration * 60000)
    
    if (isAfter(now, bookingEnd)) {
      acc.pastBookings.push(booking)
    } else if (isBefore(now, bookingStart)) {
      acc.futureBookings.push(booking)
    } else {
      acc.currentBookings.push(booking)
    }
    
    return acc
  }, {
    pastBookings: [] as StaffBookingWithRelations[],
    currentBookings: [] as StaffBookingWithRelations[],
    futureBookings: [] as StaffBookingWithRelations[]
  })

  const renderBooking = (booking: StaffBookingWithRelations, status: 'past' | 'current' | 'future') => {
    const isSelected = selectedBooking?.id === booking.id
    const isOwnBooking = booking.staff_id === user?.id
    const startTime = booking.scheduled_at ? format(new Date(booking.scheduled_at), 'HH:mm') : ''
    const endTime = booking.scheduled_at && booking.services?.duration_minutes
      ? format(new Date(new Date(booking.scheduled_at).getTime() + booking.services.duration_minutes * 60000), 'HH:mm')
      : ''

    const statusColors = {
      past: 'border-l-gray-400 bg-gray-50 text-gray-600',
      current: 'border-l-green-400 bg-green-50 text-green-900',
      future: isOwnBooking ? 'border-l-blue-400 bg-blue-50 text-blue-900' : 'border-l-purple-400 bg-purple-50 text-purple-900'
    }

    return (
      <div
        key={booking.id}
        onClick={() => onBookingSelect(booking)}
        className={`
          p-3 mb-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm
          ${statusColors[status]}
          ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
        `}
      >
        {/* Time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1 text-sm font-semibold">
            <Clock className="h-3 w-3" />
            <span>{startTime}</span>
            {endTime && <span className="text-gray-500">- {endTime}</span>}
          </div>
          {status === 'current' && (
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Nu Bezig
            </span>
          )}
        </div>

        {/* Client */}
        <div className="flex items-center space-x-2 mb-2">
          <User className="h-3 w-3 text-gray-500" />
          <span className="text-sm font-medium">
            {booking.clients?.first_name} {booking.clients?.last_name}
          </span>
        </div>

        {/* Service */}
        {booking.services?.name && (
          <div className="text-sm text-gray-600 mb-2">
            {booking.services.name}
            {booking.services.duration_minutes && (
              <span className="ml-2 text-xs text-gray-500">
                ({booking.services.duration_minutes}min)
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {booking.services?.price && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Euro className="h-3 w-3" />
            <span>€{booking.services.price.toFixed(2)}</span>
          </div>
        )}

        {/* Staff member (if viewing all appointments) */}
        {!isOwnBooking && booking.users && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
            Medewerker: {booking.users.first_name} {booking.users.last_name}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
          <span className={`text-xs font-medium ${
            status === 'past' ? 'text-gray-500' :
            status === 'current' ? 'text-green-600' :
            'text-blue-600'
          }`}>
            {status === 'past' ? 'Voltooid' :
             status === 'current' ? 'Bezig' :
             'Gepland'}
          </span>
          
          {booking.clients?.phone && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Phone className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{booking.clients.phone}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (sortedBookings.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h2 className="text-heading">Vandaag</h2>
        </div>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Geen afspraken vandaag</p>
          <p className="text-gray-400 text-xs mt-1">Geniet van je vrije tijd!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h2 className="text-heading">Vandaag</h2>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {sortedBookings.length} afspraken
        </span>
      </div>

      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {/* Current appointments */}
        {currentBookings.map(booking => renderBooking(booking, 'current'))}
        
        {/* Future appointments */}
        {futureBookings.map(booking => renderBooking(booking, 'future'))}
        
        {/* Past appointments */}
        {pastBookings.length > 0 && (
          <>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide py-2 border-t border-gray-200">
              Voltooid
            </div>
            {pastBookings.map(booking => renderBooking(booking, 'past'))}
          </>
        )}
      </div>

      {/* Quick summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{pastBookings.length}</div>
            <div className="text-xs text-gray-500">Voltooid</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{currentBookings.length}</div>
            <div className="text-xs text-gray-500">Bezig</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">{futureBookings.length}</div>
            <div className="text-xs text-gray-500">Gepland</div>
          </div>
        </div>
      </div>
    </div>
  )
}