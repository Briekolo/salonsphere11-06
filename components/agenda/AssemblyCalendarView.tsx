'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, startOfWeek, addWeeks, addDays } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useBookings, useUpdateBooking, Booking } from '@/lib/hooks/useBookings'
import { useIsMobile, useIsTablet } from '@/lib/hooks/useMediaQuery'
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { BookingFormModal } from './BookingFormModal'
import { Plus } from 'lucide-react'

interface AssemblyCalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

type ViewDuration = '1week' | '2weeks' | '1month'
type FilterType = 'all' | 'paid' | 'unpaid'

export function AssemblyCalendarView({ selectedDate, onDateSelect }: AssemblyCalendarViewProps) {
  const [currentStartDate, setCurrentStartDate] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }))
  const [viewDuration, setViewDuration] = useState<ViewDuration>('2weeks')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [hideCampaigns, setHideCampaigns] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [initialModalDate, setInitialModalDate] = useState<Date | undefined>()
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)
  
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  
  // Hooks
  const updateBookingMutation = useUpdateBooking()
  
  // Calculate date range based on view duration
  const endDate = useMemo(() => {
    // On mobile, limit to 1 week view for better performance
    const duration = isMobile ? '1week' : viewDuration
    switch (duration) {
      case '1week':
        return addDays(currentStartDate, 6)
      case '2weeks':
        return addDays(currentStartDate, 13)
      case '1month':
        return addDays(currentStartDate, 29)
    }
  }, [currentStartDate, viewDuration, isMobile])
  
  // Fetch bookings for the date range
  const { data: bookingsRaw = [], isLoading } = useBookings(
    currentStartDate.toISOString(),
    endDate.toISOString()
  )
  
  // Filter bookings based on filter type
  const bookings = useMemo(() => {
    const allBookings = bookingsRaw as Booking[]
    if (filterType === 'all') return allBookings
    
    return allBookings.filter(booking => {
      switch (filterType) {
        case 'paid':
          return booking.is_paid === true
        case 'unpaid':
          return booking.is_paid === false || booking.is_paid === null
        default:
          return true
      }
    })
  }, [bookingsRaw, filterType])
  
  // Navigation handlers
  const handlePrevious = useCallback(() => {
    switch (viewDuration) {
      case '1week':
        setCurrentStartDate(prev => addWeeks(prev, -1))
        break
      case '2weeks':
        setCurrentStartDate(prev => addWeeks(prev, -2))
        break
      case '1month':
        setCurrentStartDate(prev => addWeeks(prev, -4))
        break
    }
  }, [viewDuration])
  
  const handleNext = useCallback(() => {
    switch (viewDuration) {
      case '1week':
        setCurrentStartDate(prev => addWeeks(prev, 1))
        break
      case '2weeks':
        setCurrentStartDate(prev => addWeeks(prev, 2))
        break
      case '1month':
        setCurrentStartDate(prev => addWeeks(prev, 4))
        break
    }
  }, [viewDuration])
  
  const handleToday = useCallback(() => {
    setCurrentStartDate(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }, [])
  
  // Modal handlers
  const openModalForNew = (date?: Date) => {
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
  
  // Drag and drop handlers
  const handleDragStart = (booking: Booking) => {
    setDraggedBooking(booking)
  }
  
  const handleDragEnd = () => {
    setDraggedBooking(null)
    setDragOverDate(null)
  }
  
  const handleDragOver = (date: Date) => {
    setDragOverDate(date)
  }
  
  const handleDrop = async (targetDate: Date) => {
    if (!draggedBooking) return
    
    try {
      // Calculate the time difference to maintain the same time on the new date
      const originalDate = new Date(draggedBooking.scheduled_at)
      const newDate = new Date(targetDate)
      
      // Set the time from the original appointment to the new date
      newDate.setHours(originalDate.getHours())
      newDate.setMinutes(originalDate.getMinutes())
      newDate.setSeconds(originalDate.getSeconds())
      
      // Update the booking with the new date
      await updateBookingMutation.mutateAsync({
        id: draggedBooking.id,
        updates: {
          scheduled_at: newDate.toISOString()
        }
      })
      
      console.log('Successfully moved booking:', draggedBooking.id, 'to', newDate.toISOString())
      
    } catch (error) {
      console.error('Error moving booking:', error)
      // You might want to show a toast notification here
    } finally {
      setDraggedBooking(null)
      setDragOverDate(null)
    }
  }
  
  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: handlePrevious,
    onNext: handleNext,
    onToday: handleToday,
    onNewAppointment: () => openModalForNew(),
    onEscape: () => {
      if (isModalOpen) closeModal()
    },
    enabled: true
  })
  
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-8">
        {/* Header */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm">
            <CalendarHeader
              currentMonth={format(currentStartDate, isMobile ? 'MMM yyyy' : 'MMMM yyyy', { locale: nl })}
              viewDuration={isMobile ? '1week' : viewDuration}
              onViewDurationChange={setViewDuration}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              filterType={filterType}
              onFilterChange={setFilterType}
              hideCampaigns={hideCampaigns}
              onHideCampaignsChange={setHideCampaigns}
              isMobile={isMobile}
              onNewAppointment={() => openModalForNew()}
            />
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden p-4 pt-0">
          <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden">
            <CalendarGrid
              startDate={currentStartDate}
              endDate={endDate}
              bookings={bookings}
              onDateSelect={onDateSelect}
              onBookingSelect={openModalForEdit}
              onEmptySlotClick={openModalForNew}
              isLoading={isLoading}
              isMobile={isMobile}
              viewDuration={isMobile ? '1week' : viewDuration}
              draggedBooking={draggedBooking}
              dragOverDate={dragOverDate}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button */}
      {isMobile && (
        <button
          onClick={() => openModalForNew()}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#02011F] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all z-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      
      {/* Booking Modal */}
      {isModalOpen && (
        <BookingFormModal
          bookingId={selectedBookingId}
          initialDate={initialModalDate}
          onClose={closeModal}
        />
      )}
    </div>
  )
}