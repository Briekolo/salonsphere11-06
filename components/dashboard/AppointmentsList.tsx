import { Clock, User } from 'lucide-react'

interface Appointment {
  id: string
  time: string
  clientName: string
  service: string
  status: 'confirmed' | 'new'
  avatar: string
}

const appointments: Appointment[] = [
  {
    id: '1',
    time: '09:30 - 10:15',
    clientName: 'Emma de Vries',
    service: 'Pedicure',
    status: 'confirmed',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '2',
    time: '11:00 - 12:30',
    clientName: 'Sophie Janssen',
    service: 'Pedicure',
    status: 'confirmed',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '3',
    time: '13:15 - 14:00',
    clientName: 'Thomas Bakker',
    service: 'Pedicure',
    status: 'new',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '4',
    time: '15:30 - 17:00',
    clientName: 'Lisa Visser',
    service: 'Pedicure',
    status: 'confirmed',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  }
]

export function AppointmentsList() {
  return (
    <div className="card h-fit">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-heading">Afspraken vandaag</h2>
        <button className="text-xs lg:text-sm text-primary-500 hover:text-primary-700 min-h-[44px] flex items-center">
          Bekijk alle
        </button>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center gap-3 lg:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors min-h-[60px]">
            <div className="text-xs lg:text-sm font-medium text-gray-600 w-16 lg:w-20 flex-shrink-0">
              {appointment.time}
            </div>
            
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={appointment.avatar} 
                alt={appointment.clientName}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm lg:text-base">
                {appointment.clientName}
              </p>
              <p className="text-xs lg:text-sm text-gray-600 truncate">
                {appointment.service}
              </p>
            </div>
            
            <span className={`status-chip ${appointment.status} flex-shrink-0`}>
              {appointment.status === 'confirmed' ? 'Bevestigd' : 'Nieuw'}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 lg:mt-6 btn-outlined">
        Afspraak toevoegen
      </button>
    </div>
  )
}