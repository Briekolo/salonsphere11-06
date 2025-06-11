'use client'

import { Clock, User, Phone, Mail, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface AppointmentsListProps {
  selectedDate: Date
  listView?: boolean
}

interface Appointment {
  id: string
  time: string
  clientName: string
  service: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  avatar: string
  phone: string
  email: string
  duration: number
  notes?: string
}

const appointments: Appointment[] = [
  {
    id: '1',
    time: '09:30',
    clientName: 'Emma de Vries',
    service: 'Pedicure',
    status: 'confirmed',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    phone: '+31 6 12345678',
    email: 'emma@example.com',
    duration: 45
  },
  {
    id: '2',
    time: '11:00',
    clientName: 'Sophie Janssen',
    service: 'Manicure',
    status: 'scheduled',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    phone: '+31 6 87654321',
    email: 'sophie@example.com',
    duration: 90
  },
  {
    id: '3',
    time: '13:15',
    clientName: 'Thomas Bakker',
    service: 'Massage',
    status: 'confirmed',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    phone: '+31 6 11223344',
    email: 'thomas@example.com',
    duration: 60,
    notes: 'Eerste bezoek, allergisch voor lavendel'
  },
  {
    id: '4',
    time: '15:30',
    clientName: 'Lisa Visser',
    service: 'Gezichtsbehandeling',
    status: 'completed',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    phone: '+31 6 99887766',
    email: 'lisa@example.com',
    duration: 90
  }
]

export function AppointmentsList({ selectedDate, listView = false }: AppointmentsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bevestigd'
      case 'scheduled': return 'Ingepland'
      case 'completed': return 'Afgerond'
      case 'cancelled': return 'Geannuleerd'
      default: return status
    }
  }

  if (listView) {
    return (
      <div className="card">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
          <h2 className="text-heading">Alle afspraken</h2>
          <button className="btn-primary self-start sm:self-auto">
            Nieuwe afspraak
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={appointment.avatar} 
                    alt={appointment.clientName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{appointment.clientName}</div>
                    <div className="text-sm text-gray-600">{appointment.service}</div>
                  </div>
                </div>
                <span className={`status-chip ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {appointment.time} ({appointment.duration}min)
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {appointment.notes && (
                <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  <strong>Notitie:</strong> {appointment.notes}
                </div>
              )}
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
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium">{appointment.time}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={appointment.avatar} 
                        alt={appointment.clientName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{appointment.clientName}</div>
                        {appointment.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{appointment.service}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-600">{appointment.duration}min</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`status-chip ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Phone className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Mail className="w-4 h-4 text-gray-500" />
                      </button>
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
      </div>
    )
  }

  return (
    <div className="card h-fit">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-heading">
          Afspraken {format(selectedDate, 'd MMMM', { locale: nl })}
        </h2>
        <button className="text-xs lg:text-sm text-primary-500 hover:text-primary-700 min-h-[44px] flex items-center">
          Bekijk alle
        </button>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="p-3 lg:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img 
                  src={appointment.avatar} 
                  alt={appointment.clientName}
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900 text-sm lg:text-base">
                    {appointment.clientName}
                  </h4>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {appointment.service}
                  </p>
                </div>
              </div>
              
              <span className={`status-chip ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs lg:text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                  {appointment.time} ({appointment.duration}min)
                </div>
              </div>
              
              <div className="flex items-center gap-1 lg:gap-2">
                <button className="p-1 hover:bg-white rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
                <button className="p-1 hover:bg-white rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Mail className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
                <button className="p-1 hover:bg-white rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <MoreVertical className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
              </div>
            </div>
            
            {appointment.notes && (
              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                <strong>Notitie:</strong> {appointment.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="w-full mt-4 lg:mt-6 btn-outlined">
        Afspraak toevoegen
      </button>
    </div>
  )
}