'use client'

import { useState, useRef, useEffect } from 'react'
import { Move, Clock, User } from 'lucide-react'
import { Booking } from '@/lib/hooks/useBookings'

interface AppointmentCardProps {
  booking: Booking
  onEdit: (bookingId: string) => void
  onDragStart: (bookingId: string) => void
  onDragEnd: () => void
  isDragging?: boolean
}

export function AppointmentCard({ 
  booking, 
  onEdit, 
  onDragStart,
  onDragEnd,
  isDragging = false 
}: AppointmentCardProps) {
  const [showDragHandle, setShowDragHandle] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const paymentStyles = {
    paid: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      hover: 'hover:bg-green-100',
      text: 'text-green-900',
      icon: 'text-green-600'
    },
    unpaid: {
      bg: 'bg-gray-50',
      border: 'border-gray-400',
      hover: 'hover:bg-gray-100',
      text: 'text-gray-900',
      icon: 'text-gray-600'
    }
  }
  
  const style = paymentStyles[booking.is_paid ? 'paid' : 'unpaid']
  
  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={(e) => {
        onDragStart(booking.id)
        e.dataTransfer.effectAllowed = 'move'
        // Create a semi-transparent drag image
        if (cardRef.current) {
          const dragImage = cardRef.current.cloneNode(true) as HTMLElement
          dragImage.style.opacity = '0.7'
          dragImage.style.position = 'absolute'
          dragImage.style.top = '-1000px'
          document.body.appendChild(dragImage)
          e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY)
          setTimeout(() => document.body.removeChild(dragImage), 0)
        }
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowDragHandle(true)}
      onMouseLeave={() => setShowDragHandle(false)}
      onClick={() => onEdit(booking.id)}
      className={`
        relative w-full p-3 rounded-lg border-l-4 cursor-pointer
        transition-all duration-200 ease-in-out
        ${style.bg} ${style.border} ${style.hover} ${style.text}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02] hover:shadow-md'}
        ${showDragHandle ? 'pl-8' : ''}
      `}
      style={{
        minHeight: '60px',
        boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Drag Handle */}
      <div 
        className={`
          absolute left-2 top-1/2 -translate-y-1/2
          transition-all duration-200
          ${showDragHandle ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="flex flex-col gap-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className={`w-4 h-4 ${style.icon}`} />
          <span className="font-medium text-sm">
            {booking.clients?.first_name} {booking.clients?.last_name}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium">{booking.services?.name}</span>
          <div className="flex items-center gap-1">
            <Clock className={`w-3 h-3 ${style.icon}`} />
            <span>{booking.duration_minutes}min</span>
          </div>
        </div>
      </div>
      
      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group"
        onMouseDown={(e) => {
          e.stopPropagation()
          // Resize logic will be handled by parent
        }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}