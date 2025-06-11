'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { nl } from 'date-fns/locale'

interface CalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

interface TimeSlot {
  time: string
  appointment?: {
    id: string
    clientName: string
    service: string
    status: 'scheduled' | 'confirmed' | 'completed'
    duration: number
  }
}

const timeSlots: TimeSlot[] = [
  { time: '09:00' },
  { 
    time: '09:30', 
    appointment: {
      id: '1',
      clientName: 'Emma de Vries',
      service: 'Pedicure',
      status: 'confirmed',
      duration: 45
    }
  },
  { time: '10:15' },
  { time: '10:30' },
  { 
    time: '11:00', 
    appointment: {
      id: '2',
      clientName: 'Sophie Janssen',
      service: 'Manicure',
      status: 'scheduled',
      duration: 90
    }
  },
  { time: '12:30' },
  { time: '13:00' },
  { 
    time: '13:15', 
    appointment: {
      id: '3',
      clientName: 'Thomas Bakker',
      service: 'Massage',
      status: 'confirmed',
      duration: 60
    }
  },
  { time: '14:15' },
  { time: '14:30' },
  { time: '15:00' },
  { 
    time: '15:30', 
    appointment: {
      id: '4',
      clientName: 'Lisa Visser',
      service: 'Gezichtsbehandeling',
      status: 'completed',
      duration: 90
    }
  },
  { time: '17:00' },
  { time: '17:30' },
  { time: '18:00' },
]

export function CalendarView({ selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="card">
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
          
          <button className="btn-primary flex items-center gap-2 self-start lg:self-auto">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nieuwe afspraak</span>
          </button>
        </div>
      </div>

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
            {days.map((day) => (
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
          <h4 className="font-semibold mb-4 text-sm lg:text-base">
            {format(selectedDate, 'EEEE d MMMM', { locale: nl })}
          </h4>
          
          <div className="space-y-2 max-h-60 lg:max-h-80 overflow-y-auto">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 lg:gap-3">
                <div className="text-xs lg:text-sm text-gray-500 w-10 lg:w-12 flex-shrink-0">
                  {slot.time}
                </div>
                
                {slot.appointment ? (
                  <div className={`
                    flex-1 p-2 lg:p-3 rounded-lg border-l-4 
                    ${slot.appointment.status === 'confirmed' 
                      ? 'bg-green-50 border-green-400' 
                      : slot.appointment.status === 'completed'
                      ? 'bg-gray-50 border-gray-400'
                      : 'bg-blue-50 border-blue-400'
                    }
                  `}>
                    <div className="font-medium text-xs lg:text-sm">
                      {slot.appointment.clientName}
                    </div>
                    <div className="text-xs text-gray-600">
                      {slot.appointment.service} • {slot.appointment.duration}min
                    </div>
                  </div>
                ) : (
                  <button className="flex-1 p-2 lg:p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-xs lg:text-sm text-gray-500 min-h-[44px] flex items-center justify-center">
                    + Afspraak toevoegen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}