'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, Loader2 } from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths,
  setHours, setMinutes, startOfWeek, endOfWeek, addDays, differenceInMinutes
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { useBookings, useUpdateBooking, Booking } from '@/lib/hooks/useBookings'
import { BookingFormModal } from './BookingFormModal'
import { AppointmentCard } from './AppointmentCard'
import { DropZone } from './DropZone'
import { useToast } from '@/components/providers/ToastProvider'

interface EnhancedCalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

type ViewMode = 'day' | 'week' | 'month' | 'staff'

export function EnhancedCalendarView({ selectedDate, onDateSelect }: EnhancedCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [initialModalDate, setInitialModalDate] = useState<Date | undefined>()
  
  // Drag state
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null)
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null)
  const resizeRef = useRef<{ id: string; startY: number; initialDuration: number } | null>(null)
  
  // Undo/Redo stack
  const [undoStack, setUndoStack] = useState<Array<{ id: string; field: string; oldValue: any; newValue: any }>>([])
  const [redoStack, setRedoStack] = useState<Array<{ id: string; field: string; oldValue: any; newValue: any }>>([])
  
  const updateMutation = useUpdateBooking()
  const { showToast } = useToast()
  
  // Calculate date ranges
  const monthRangeStart = startOfMonth(currentMonth)
  const monthRangeEnd = endOfMonth(currentMonth)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  
  const [startOfDay, endOfDay] = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(7, 0, 0, 0) // Start at 7 AM
    const end = new Date(selectedDate)
    end.setHours(21, 0, 0, 0) // End at 9 PM
    return [start.toISOString(), end.toISOString()]
  }, [selectedDate])
  
  // Fetch bookings based on view mode
  const { data: bookingsRaw = [], isLoading } = useBookings(
    viewMode === 'day' ? startOfDay :
    viewMode === 'week' || viewMode === 'staff' ? weekStart.toISOString() :
    monthRangeStart.toISOString(),
    
    viewMode === 'day' ? endOfDay :
    viewMode === 'week' || viewMode === 'staff' ? weekEnd.toISOString() :
    monthRangeEnd.toISOString()
  )
  const bookings = bookingsRaw as Booking[]
  
  // Time slots (7 AM to 9 PM in 30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 7; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 30) break // Stop at 8:30 PM
        const date = setMinutes(setHours(new Date(selectedDate), hour), minute)
        slots.push({
          hour,
          minute,
          timeLabel: format(date, 'HH:mm'),
          date
        })
      }
    }
    return slots
  }, [selectedDate])
  
  // Check for conflicts
  const hasConflict = useCallback((date: Date, duration: number, excludeId?: string) => {
    const endTime = new Date(date.getTime() + duration * 60000)
    return bookings.some(booking => {
      if (booking.id === excludeId) return false
      const bookingStart = new Date(booking.scheduled_at)
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60000)
      return (
        (date >= bookingStart && date < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (date <= bookingStart && endTime >= bookingEnd)
      )
    })
  }, [bookings])
  
  // Handle appointment update with undo support
  const handleUpdate = useCallback((id: string, field: string, newValue: any, oldValue: any) => {
    // Check for conflicts if updating time
    if (field === 'scheduled_at' && draggedBooking) {
      const hasConflictAtNewTime = hasConflict(new Date(newValue), draggedBooking.duration_minutes, id)
      if (hasConflictAtNewTime) {
        showToast('Kan afspraak niet verplaatsen: tijdslot is bezet', 'error')
        return
      }
    }
    
    // Add to undo stack
    setUndoStack(prev => [...prev, { id, field, oldValue, newValue }])
    setRedoStack([]) // Clear redo stack on new action
    
    // Perform update
    updateMutation.mutate(
      { id, updates: { [field]: newValue } as any },
      {
        onSuccess: () => {
          showToast('Afspraak bijgewerkt', 'success')
        },
        onError: () => {
          showToast('Fout bij bijwerken van afspraak', 'error')
          // Remove from undo stack on error
          setUndoStack(prev => prev.slice(0, -1))
        }
      }
    )
  }, [updateMutation, showToast, hasConflict, draggedBooking])
  
  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const action = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setRedoStack(prev => [...prev, action])
    updateMutation.mutate({ id: action.id, updates: { [action.field]: action.oldValue } as any })
  }, [undoStack, updateMutation])
  
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const action = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    setUndoStack(prev => [...prev, action])
    updateMutation.mutate({ id: action.id, updates: { [action.field]: action.newValue } as any })
  }, [redoStack, updateMutation])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])
  
  // Modal handlers
  const openModalForNew = (date: Date) => {
    setSelectedBookingId(null)
    setInitialModalDate(date)
    setIsModalOpen(true)
  }
  
  const openModalForEdit = (bookingId: string) => {
    setInitialModalDate(undefined)
    setSelectedBookingId(bookingId)
    setIsModalOpen(true)
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBookingId(null)
    setInitialModalDate(undefined)
  }
  
  // Drag handlers
  const handleDragStart = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      setDraggedBookingId(bookingId)
      setDraggedBooking(booking)
    }
  }
  
  const handleDragEnd = () => {
    setDraggedBookingId(null)
    setDraggedBooking(null)
  }
  
  const handleDrop = (date: Date) => {
    if (!draggedBookingId || !draggedBooking) return
    
    const oldDate = new Date(draggedBooking.scheduled_at)
    if (oldDate.getTime() !== date.getTime()) {
      handleUpdate(draggedBookingId, 'scheduled_at', date.toISOString(), oldDate.toISOString())
    }
    
    handleDragEnd()
  }
  
  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      
      const diff = e.clientY - resizeRef.current.startY
      const slotHeight = 60 // Height of one 30-min slot
      const steps = Math.round(diff / slotHeight)
      const newDuration = Math.max(30, resizeRef.current.initialDuration + steps * 30)
      
      // Show preview (could update UI here)
      // For now, we'll update on mouse up
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!resizeRef.current) return
      
      const diff = e.clientY - resizeRef.current.startY
      const slotHeight = 60
      const steps = Math.round(diff / slotHeight)
      const newDuration = Math.max(30, resizeRef.current.initialDuration + steps * 30)
      
      if (newDuration !== resizeRef.current.initialDuration) {
        const booking = bookings.find(b => b.id === resizeRef.current!.id)
        if (booking) {
          handleUpdate(
            resizeRef.current.id,
            'duration_minutes',
            newDuration,
            resizeRef.current.initialDuration
          )
        }
      }
      
      resizeRef.current = null
    }
    
    if (resizeRef.current) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [bookings, handleUpdate])
  
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-heading">Agenda</h2>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              {(['day', 'week', 'staff'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${viewMode === mode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {mode === 'day' ? 'Dag' : 
                   mode === 'week' ? 'Week' : 
                   'Personeel'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Ongedaan maken (Cmd+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Opnieuw (Cmd+Y)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
            
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => openModalForNew(new Date())} 
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe afspraak
            </button>
          </div>
        </div>
        
        {/* Calendar content based on view mode */}
        {viewMode === 'day' && (
          <div className="relative">
            {/* Time ruler */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gray-50 border-r border-gray-200">
              {timeSlots.map(({ timeLabel }, index) => (
                <div 
                  key={timeLabel}
                  className="h-[60px] flex items-center justify-center text-xs text-gray-500 border-b border-gray-100"
                >
                  {index % 2 === 0 && timeLabel}
                </div>
              ))}
            </div>
            
            {/* Day schedule */}
            <div className="ml-16 relative">
              {timeSlots.map(({ date, timeLabel }) => {
                const slotBooking = bookings.find(b => 
                  isSameDay(new Date(b.scheduled_at), date) && 
                  format(new Date(b.scheduled_at), 'HH:mm') === timeLabel
                )
                
                return (
                  <div 
                    key={timeLabel} 
                    className="h-[60px] border-b border-gray-100 relative"
                  >
                    {slotBooking ? (
                      <div className="absolute inset-x-2 inset-y-1">
                        <AppointmentCard
                          booking={slotBooking}
                          onEdit={openModalForEdit}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedBookingId === slotBooking.id}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-x-2 inset-y-1">
                        <DropZone
                          date={date}
                          timeLabel={timeLabel}
                          onDrop={handleDrop}
                          onClick={() => openModalForNew(date)}
                          isDragActive={!!draggedBookingId}
                          hasConflict={draggedBooking ? hasConflict(date, draggedBooking.duration_minutes, draggedBookingId) : false}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Placeholder for other view modes */}
        {viewMode !== 'day' && (
          <div className="text-center py-12 text-gray-500">
            {viewMode === 'week' ? 'Week weergave komt binnenkort' : 
             viewMode === 'staff' ? 'Personeel weergave komt binnenkort' :
             'Maand weergave komt binnenkort'}
          </div>
        )}
      </div>
      
      {/* Booking modal */}
      {isModalOpen && (
        <BookingFormModal
          bookingId={selectedBookingId}
          initialDate={initialModalDate}
          onClose={closeModal}
        />
      )}
    </>
  )
}