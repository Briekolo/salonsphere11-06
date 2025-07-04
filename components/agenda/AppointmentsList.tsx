'use client'

import { useMemo, useState } from 'react'
import { Clock, User, Phone, Mail, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useBookings, Booking } from '@/lib/hooks/useBookings'
import { BookingFormModal } from './BookingFormModal'

interface AppointmentsListProps {
  selectedDate: Date
  listView?: boolean
}

export function AppointmentsList({ selectedDate, listView = false }: AppointmentsListProps) {
  const { startOfDay, endOfDay } = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate)
    end.setHours(23, 59, 59, 999)
    return { startOfDay: start, endOfDay: end }
  }, [selectedDate])

  /**
   * We houden `bookingData` apart zodat we kunnen detecteren of er al een vorige
   * dataset in de cache zat.  Op die manier tonen we de loader enkel tijdens de
   * eerste fetch.  Bij latere refetches blijft de bestaande data zichtbaar en
   * vermijden we het 'flikkeren' tussen "Afspraken laden..." en
   * "Geen afspraken".
   */
  const { data: bookingData, isLoading } = useBookings(
    listView ? undefined : startOfDay.toISOString(),
    listView ? undefined : endOfDay.toISOString()
  )

  const bookings: Booking[] = (bookingData ?? []) as Booking[]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bevestigd'
      case 'scheduled':
        return 'Ingepland'
      case 'completed':
        return 'Afgerond'
      case 'cancelled':
        return 'Geannuleerd'
      default:
        return status
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Toon loader alleen als er nog helemaal geen data binnen is.
  if (isLoading && !bookingData) {
    return <div className="card p-6 text-center">Afspraken laden...</div>
  }

  if (!isLoading && bookings.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p>Geen afspraken voor deze datum.</p>
      </div>
    )
  }

  const renderAvatar = (booking: Booking) => {
    const initials = `${booking.clients?.first_name?.charAt(0) ?? ''}${booking.clients?.last_name?.charAt(0) ?? ''}`
    return (
      <div className="w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-xs font-medium">
        {initials || <User className="w-3 h-3" />}
      </div>
    )
  }

  const sorted = bookings.slice().sort((a,b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )

  if (listView) {
    return (
      <div className="card">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
          <h2 className="text-heading">Alle afspraken</h2>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary self-start sm:self-auto">Nieuwe afspraak</button>
        </div>
        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {sorted.map((booking) => (
            <div key={booking.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {renderAvatar(booking)}
                  <div>
                    <div className="font-medium text-gray-900">{booking.clients?.first_name} {booking.clients?.last_name}</div>
                    <div className="text-sm text-gray-600">{booking.services?.name}</div>
                  </div>
                </div>
                <span className={`status-chip ${getStatusColor(booking.status)}`}>{getStatusText(booking.status)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(new Date(booking.scheduled_at), 'HH:mm', { locale: nl })} ({booking.services?.duration_minutes ?? 0}min)
                </div>
                <div className="flex items-center gap-2">
                  {booking.clients?.phone && (
                    <button className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                  {booking.clients?.email && (
                    <button className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tijd</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Klant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Behandeling</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Duur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium whitespace-nowrap">{format(new Date(booking.scheduled_at), 'd MMM, HH:mm', { locale: nl })}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {renderAvatar(booking)}
                      <div>
                        <div className="font-medium">{booking.clients?.first_name} {booking.clients?.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{booking.services?.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-600">{booking.services?.duration_minutes ?? 0}min</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`status-chip ${getStatusColor(booking.status)}`}>{getStatusText(booking.status)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600 space-y-1">
                      {booking.clients?.email && <div>{booking.clients.email}</div>}
                      {booking.clients?.phone && <div>{booking.clients.phone}</div>}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isModalOpen && (
          <BookingFormModal initialDate={selectedDate} onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    )
  }

  /* compact day view */
  return (
    <div className="space-y-4">
      {sorted.map((booking) => (
        <div key={booking.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            {renderAvatar(booking)}
            <div>
              <div className="font-medium text-gray-900">{booking.clients?.first_name} {booking.clients?.last_name}</div>
              <div className="text-xs text-gray-600">{booking.services?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {format(new Date(booking.scheduled_at), 'HH:mm', { locale: nl })}
          </div>
        </div>
      ))}
    </div>
  )
}