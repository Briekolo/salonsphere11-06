'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Move } from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths,
  setHours, setMinutes, startOfWeek, endOfWeek, addDays
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { useBookings, useUpdateBooking, Booking } from '@/lib/hooks/useBookings'
import { BookingFormModal } from './BookingFormModal'

interface CalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

type Mode = 'day' | 'week' | 'month'

export function CalendarView({ selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)
  const [mode, setMode] = useState<Mode>('day')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [initialModalDate, setInitialModalDate] = useState<Date | undefined>()

  // Drag & resize helpers
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null)
  const resizeState = useRef<{ id: string; startY: number; initialDuration: number } | null>(null)

  const updateMutation = useUpdateBooking()

  // ---------- UI helpers ----------
  const statusClasses = (status:string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 border-green-400 hover:bg-green-100'
      case 'completed': return 'bg-gray-50 border-gray-400 hover:bg-gray-100'
      case 'cancelled': return 'bg-red-50 border-red-400 hover:bg-red-100'
      default: // scheduled
        return 'bg-blue-50 border-blue-400 hover:bg-blue-100'
    }
  }

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

  const monthRangeStart = startOfMonth(currentMonth)
  const monthRangeEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthRangeStart, end: monthRangeEnd })

  // Padding voor lege cellen aan begin van maand (Maandag start)
  const leadingBlank = (monthRangeStart.getDay() + 6) % 7 // 0 = Ma
  const monthGridDays = [
    ...Array.from({ length: leadingBlank }).map(() => null as Date | null),
    ...daysInMonth,
  ]

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const [startOfDay, endOfDay] = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate)
    end.setHours(23, 59, 59, 999)
    return [start.toISOString(), end.toISOString()]
  }, [selectedDate])

  // Bereken week en maand range voor huidige selectie
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // maandag
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })

  // Fetch bookings afhankelijk van modus
  const { data: bookingsRaw = [], isLoading } = useBookings(
    mode === 'day'
      ? startOfDay
      : mode === 'week'
        ? weekStart.toISOString()
        : monthRangeStart.toISOString(),
    mode === 'day'
      ? endOfDay
      : mode === 'week'
        ? weekEnd.toISOString()
        : monthRangeEnd.toISOString()
  )
  const bookings = bookingsRaw as Booking[]

  // Map voor snelle lookup per datum (yyyy-MM-dd)
  const bookingsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    bookings.forEach((b: Booking) => {
      const key = format(new Date(b.scheduled_at), 'yyyy-MM-dd')
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [bookings])

  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2)
    const minute = i % 2 === 0 ? 0 : 30
    const date = setMinutes(setHours(new Date(selectedDate), hour), minute)
    const timeLabel = format(date, 'HH:mm')
    return { hour, minute, timeLabel }
  })

  const dayViewSlots = timeSlots.map(({ hour, minute, timeLabel }) => {
    const date = setMinutes(setHours(new Date(selectedDate), hour), minute)
    const booking = bookings.find((b: Booking) => isSameDay(new Date(b.scheduled_at), selectedDate) && format(new Date(b.scheduled_at), 'HH:mm') === timeLabel)
    return { date, timeLabel, booking }
  })

  // Resize global listeners
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizeState.current) return
      const diff = e.clientY - resizeState.current.startY
      const slotHeight = 44 // px
      const steps = Math.round(diff / slotHeight)
      const newDuration = Math.max(30, resizeState.current.initialDuration + steps * 30)
      // optimistic UI could be added; we'll update on mouseup
      // @ts-ignore
      resizeState.current.newDuration = newDuration
    }
    function onMouseUp() {
      if (resizeState.current) {
        // @ts-ignore
        const { id, newDuration, initialDuration } = resizeState.current as any
        if (newDuration && newDuration !== initialDuration) {
          updateMutation.mutate({ id, updates: { duration_minutes: newDuration } as any })
        }
      }
      resizeState.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    if (resizeState.current) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
}, [updateMutation]);

  return (
    <>
      <div className="card">
        {/* Modus toggle */}
        <div className="flex items-center gap-2 mb-4">
          {(['day','week','month'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${mode===m ? 'bg-[#02011F] text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >{m === 'day' ? 'Dag' : m === 'week' ? 'Week' : 'Maand'}</button>
          ))}
        </div>

        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
          <h2 className="text-heading">Agenda</h2>
          
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <h3 className="text-base lg:text-lg font-semibold min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </h3>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <button onClick={() => openModalForNew(new Date())} className="btn-primary self-start lg:self-auto">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nieuwe afspraak</span>
            </button>
          </div>
        </div>

        {/* Content afhankelijk van modus */}
        {mode === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {monthGridDays.map((day, idx) => {
              if (!day) return <div key={idx} />
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { onDateSelect(day); setMode('day') }}
                  className={`p-2 text-xs rounded-lg transition-colors min-h-[44px] flex flex-col items-start gap-1 ${
                    isSameDay(day, selectedDate)
                      ? 'bg-[#02011F] text-white'
                      : isToday(day)
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {bookingsByDate[format(day,'yyyy-MM-dd')] ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-primary-500 mt-1" />
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {mode === 'week' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-14"></th>
                  {Array.from({length:7}).map((_, idx)=>{
                    const date = addDays(weekStart, idx)
                    const hasBooking = bookingsByDate[format(date,'yyyy-MM-dd')] > 0
                    return (
                      <th key={idx} className="py-2 text-xs font-medium text-gray-600 text-center">
                        {format(date,'EEE d',{locale:nl})}
                        {hasBooking && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 ml-1 align-middle" />}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(({hour,minute,timeLabel})=>{
                  return (
                    <tr key={timeLabel} className="border-t">
                      <td className="text-xs text-gray-500 pr-2 py-1 whitespace-nowrap">{timeLabel}</td>
                      {Array.from({length:7}).map((_,idx)=>{
                        const cellDate = setMinutes(setHours(new Date(addDays(weekStart,idx)),hour),minute)
                        const booking = bookings.find((b: Booking)=> isSameDay(new Date(b.scheduled_at), cellDate) && format(new Date(b.scheduled_at),'HH:mm')===timeLabel)
                        return (
                          <td key={idx} className="py-0.5 px-1">
                            {booking ? (
                              <button onClick={()=>openModalForEdit(booking.id)} className={`w-full text-left text-xs rounded px-1 ${statusClasses(booking.status)}`}>
                                {booking.clients?.first_name}
                              </button>
                            ) : (
                              <button onClick={()=>openModalForNew(cellDate)} className="w-full h-6 border border-dashed border-gray-200 hover:border-primary-300 rounded"></button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {mode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap">
          {/* Mini Calendar */}
          <div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
                <div key={day} className="text-center text-xs lg:text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={`
                    p-2 text-xs lg:text-sm rounded-lg transition-colors min-h-[44px] flex items-center justify-center
                    ${isSameDay(day, selectedDate) 
                      ? 'bg-[#02011F] text-white' 
                      : isToday(day)
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100'
                    }
                  `}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          {/* Day Schedule */}
          <div>
            <h4 className="font-semibold mb-1 text-sm lg:text-base">
              {format(selectedDate, 'EEEE d MMMM', { locale: nl })}
            </h4>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <Move className="w-3 h-3" />
              <span>Sleep afspraken of trek onderaan om de duur te wijzigen</span>
            </div>
            
            <div className="space-y-2 max-h-60 lg:max-h-80 overflow-y-auto">
              {dayViewSlots.map(({ date, timeLabel, booking }, index) => (
                <div key={index} className="flex items-center gap-2 lg:gap-3">
                  <div className="text-xs lg:text-sm text-gray-500 w-10 lg:w-12 flex-shrink-0">
                    {timeLabel}
                  </div>
                  
                  {booking ? (
                    <div
                      draggable
                      onDragStart={(e)=>{ setDraggedBookingId(booking.id); e.dataTransfer.effectAllowed='move' }}
                      onDragEnd={()=> setDraggedBookingId(null)}
                      className={`
                        w-full text-left flex-1 p-2 lg:p-3 rounded-lg border-l-4 cursor-grab active:cursor-grabbing relative
                        ${statusClasses(booking.status)}
                      `}
                      onClick={()=>openModalForEdit(booking.id)}
                      >
                      <div className="font-medium text-xs lg:text-sm">
                        {booking.clients?.first_name} {booking.clients?.last_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {booking.services?.name} • {booking.duration_minutes}min
                      </div>
                      {/* Resize handle */}
                      <div
                        onMouseDown={(e)=>{
                          e.stopPropagation()
                          resizeState.current = { id: booking.id, startY: e.clientY, initialDuration: booking.duration_minutes }
                        }}
                        className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize bg-transparent"/>
                    </div>
                  ) : (
                    <button onClick={() => openModalForNew(date)} className="flex-1 p-2 lg:p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-xs lg:text-sm text-gray-500 min-h-[44px] flex items-center justify-center" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{
                      if(draggedBookingId){
                        updateMutation.mutate({ id: draggedBookingId, updates: { scheduled_at: date.toISOString() } as any })
                        setDraggedBookingId(null)
                      }
                    }}>
                      + Afspraak toevoegen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

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