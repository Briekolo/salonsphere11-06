"use client"

import { useMemo } from 'react'
import { CalendarPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTodayBookings } from '@/lib/hooks/useTodayBookings'
import { Booking } from '@/lib/hooks/useBookings'

function formatTimeRange(startISO: string, endISO: string) {
  if (!startISO || !endISO) return ''
  const start = new Date(startISO)
  const end = new Date(endISO)
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
  const startTime = new Intl.DateTimeFormat('nl-BE', formatOptions).format(start)
  const endTime = new Intl.DateTimeFormat('nl-BE', formatOptions).format(end)
  return `${startTime} - ${endTime}`
}

export function AppointmentsList() {
  const router = useRouter()
  const { data: bookingData, isLoading } = useTodayBookings()

  const bookings = (bookingData as Booking[]) ?? []

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) =>
      (a.start_time ?? '').localeCompare(b.start_time ?? '')
    )
  }, [bookings])

  return (
    <div className="card h-fit w-full">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-heading">Afspraken vandaag</h2>
        <button 
          onClick={() => router.push('/appointments')}
          className="text-xs lg:text-sm text-primary-500 hover:text-primary-700 min-h-[44px] flex items-center"
        >
          Bekijk alle
        </button>
      </div>

      {isLoading && !bookingData ? (
        <div className="space-y-3 lg:space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 lg:gap-4 p-3 rounded-lg bg-gray-50 min-h-[60px]"
            >
              <div className="w-16 lg:w-20 h-4 bg-gray-200 rounded" />
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 space-y-3">
          <CalendarPlus className="w-8 h-8" />
          <p className="text-sm">Er zijn nog geen afspraken voor vandaag</p>
          <button 
            onClick={() => router.push('/appointments')}
            className="btn-primary text-xs"
          >
            Afspraak toevoegen
          </button>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {sortedBookings.map(booking => {
            const clientName =
              `${booking.clients?.first_name ?? ''} ${
                booking.clients?.last_name ?? ''
              }`.trim() || 'Onbekende klant'
            const serviceName = booking.services?.name ?? 'Onbekende dienst'
            const timeRange = formatTimeRange(
              booking.start_time ?? '',
              booking.end_time ?? ''
            )
            const status =
              booking.status === 'confirmed'
                ? 'confirmed'
                : booking.status === 'scheduled'
                ? 'new'
                : 'confirmed'

            return (
              <div
                key={booking.id}
                className="flex items-center gap-3 lg:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors min-h-[60px]"
              >
                <div className="text-xs lg:text-sm font-medium text-gray-600 w-16 lg:w-20 flex-shrink-0 text-center">
                  {timeRange}
                </div>

                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200" />

                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-gray-900 truncate text-sm lg:text-base">
                    {clientName}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600 truncate">
                    {serviceName}
                  </p>
                </div>

                <span
                  className={`status-chip ${status} flex-shrink-0 ml-2`}
                >
                  {status === 'confirmed' ? 'Bevestigd' : 'Nieuw'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}