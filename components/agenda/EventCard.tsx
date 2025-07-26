'use client'

import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Booking } from '@/lib/hooks/useBookings'
import { Clock, User } from 'lucide-react'

interface EventCardProps {
  booking: Booking
  onClick: () => void
  isMobile?: boolean
  onDragStart?: (booking: Booking) => void
  onDragEnd?: () => void
  isDragging?: boolean
}

export function EventCard({ booking, onClick, isMobile = false, onDragStart, onDragEnd, isDragging = false }: EventCardProps) {
  // Get service type for tag - using inventory-style colors
  const getServiceTag = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    let color = 'bg-gray-100 text-gray-800' // default
    
    // Treatment/procedure related services (green)
    if (name.includes('behandeling') || name.includes('laser') || name.includes('therapie') || 
        name.includes('massage') || name.includes('facial') || name.includes('peeling')) {
      color = 'bg-green-100 text-green-800'
    } 
    // Consultation related services (yellow)
    else if (name.includes('consult') || name.includes('intake') || name.includes('gesprek') || 
             name.includes('advies') || name.includes('screening')) {
      color = 'bg-yellow-100 text-yellow-800'
    } 
    // Follow-up/control appointments (red)
    else if (name.includes('controle') || name.includes('follow') || name.includes('nazorg') || 
             name.includes('check') || name.includes('follow-up')) {
      color = 'bg-red-100 text-red-800'
    }
    
    return { 
      label: serviceName || 'Afspraak', 
      color: color 
    }
  }
  
  // Get status styling - using inventory-style colors
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-green-200 hover:border-green-400 hover:shadow-sm bg-green-50'
      case 'scheduled':
        return 'border-yellow-200 hover:border-yellow-400 hover:shadow-sm bg-yellow-50'
      case 'cancelled':
        return 'border-red-200 hover:border-red-400 hover:shadow-sm bg-red-50 opacity-60'
      case 'completed':
        return 'border-gray-200 hover:border-gray-400 hover:shadow-sm bg-gray-50'
      default:
        return 'border-gray-200 hover:border-gray-400 hover:shadow-sm bg-white'
    }
  }
  
  const serviceTag = getServiceTag(booking.services?.name || '')
  const statusStyle = getStatusStyling(booking.status)
  
  // Get client initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return first + last || '??'
  }
  
  const initials = getInitials(booking.clients?.first_name, booking.clients?.last_name)
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    onDragStart?.(booking)
  }
  
  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    onDragEnd?.()
  }
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick()
  }
  
  return (
    <button
      onClick={handleClick}
      draggable={!isMobile && !!onDragStart}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`event-card-assembly w-full text-left transition-all hover:shadow-md ${statusStyle} ${isMobile ? 'p-3' : ''} ${
        isDragging ? 'opacity-50 rotate-1 scale-105' : ''
      } ${!isMobile && onDragStart ? 'cursor-move' : 'cursor-pointer'}`}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Service Tag */}
            <div className="mb-2">
              <span className={`event-tag ${serviceTag.color}`}>
                {serviceTag.label}
              </span>
            </div>
            {/* Client */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span>{booking.clients?.first_name} {booking.clients?.last_name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(booking.scheduled_at), 'HH:mm')}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Layout */}
          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Clock className="w-3 h-3" />
            <span>{format(new Date(booking.scheduled_at), 'HH:mm', { locale: nl })}</span>
          </div>
      
          {/* Service Tag */}
          <div className="mb-2">
            <span className={`event-tag ${serviceTag.color}`}>
              {serviceTag.label}
            </span>
          </div>
          
          {/* Client Info */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 leading-none flex-shrink-0">
              {initials}
            </div>
            <span className="text-xs text-gray-600">
              {booking.clients?.first_name} {booking.clients?.last_name}
            </span>
          </div>
        </>
      )}
    </button>
  )
}