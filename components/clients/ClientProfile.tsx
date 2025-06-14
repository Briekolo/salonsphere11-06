'use client'

import { useState } from 'react'
import { ArrowLeft, Phone, Mail, Calendar, Star, Edit, Trash2, MessageSquare, FileText, CreditCard, Tag, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '@/lib/services/clientService';
import { useClientById, useTreatmentProgress } from '@/lib/hooks/useClients';

interface ClientProfileProps {
  clientId: string
  onBack: () => void
}

interface Appointment {
  id: string
  date: Date
  service: string
  duration: number
  price: number
  status: 'completed' | 'scheduled' | 'cancelled'
  notes?: string
}

interface Communication {
  id: string
  type: 'email' | 'phone' | 'sms'
  date: Date
  subject: string
  content: string
}

const mockClient = {
  id: '1',
  firstName: 'Emma',
  lastName: 'de Vries',
  email: 'emma@example.com',
  phone: '+31 6 12345678',
  avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  status: 'vip',
  segment: 'premium',
  dateOfBirth: new Date('1985-03-15'),
  address: 'Hoofdstraat 123, 1234 AB Amsterdam',
  joinDate: new Date('2022-06-15'),
  lastVisit: new Date('2024-01-15'),
  totalSpent: 1250,
  appointmentsCount: 12,
  tags: ['VIP', 'Regulier', 'Allergieën'],
  notes: 'Allergisch voor lavendel. Prefereert afspraken in de ochtend.',
  preferences: {
    preferredServices: ['Pedicure', 'Manicure'],
    preferredStaff: 'Julia',
    communicationPreference: 'email'
  }
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    service: 'Pedicure',
    duration: 45,
    price: 65,
    status: 'completed'
  },
  {
    id: '2',
    date: new Date('2024-01-08'),
    service: 'Manicure',
    duration: 60,
    price: 45,
    status: 'completed'
  },
  {
    id: '3',
    date: new Date('2024-01-22'),
    service: 'Pedicure',
    duration: 45,
    price: 65,
    status: 'scheduled'
  }
]

const mockCommunications: Communication[] = [
  {
    id: '1',
    type: 'email',
    date: new Date('2024-01-14'),
    subject: 'Bevestiging afspraak',
    content: 'Uw afspraak voor morgen om 10:30 is bevestigd.'
  },
  {
    id: '2',
    type: 'phone',
    date: new Date('2024-01-10'),
    subject: 'Telefonisch contact',
    content: 'Gebeld voor het verzetten van afspraak.'
  }
]

const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-primary-600 h-2.5 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export function ClientProfile({ clientId, onBack }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'communications' | 'documents' | 'trajecten'>('overview')
  const [isEditing, setIsEditing] = useState(false)

  const { data: client, isLoading: clientLoading, error: clientError } = useClientById(clientId);
  const { data: treatmentProgress, isLoading: progressLoading, error: progressError } = useTreatmentProgress(clientId);

  if (clientLoading) return <div>Laden...</div>
  if (clientError) return <div>Fout bij het laden van de klant.</div>
  if (!client) return <div>Klant niet gevonden.</div>

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Klantprofiel</h1>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <button className="btn-outlined flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Bericht sturen
          </button>
          <button className="btn-outlined flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Afspraak maken
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Opslaan' : 'Bewerken'}
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="relative self-center lg:self-start">
            <img 
              src={client.avatar_url || `https://ui-avatars.com/api/?name=${client.first_name}+${client.last_name}`}
              alt={`${client.first_name} ${client.last_name}`}
              className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover"
            />
            {client.tags?.includes('VIP') && (
              <div className="absolute -top-2 -right-2 w-6 h-6 lg:w-8 lg:h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 lg:w-4 lg:h-4 text-white fill-current" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
              <div className="text-center lg:text-left">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {client.first_name} {client.last_name}
                </h2>
                <p className="text-gray-600">{client.email}</p>
                <p className="text-gray-600">{client.phone}</p>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2 mt-4 lg:mt-0">
                <span className={`status-chip ${getStatusColor(client.status || 'active')}`}>
                  {client.status?.toUpperCase() || 'ACTIEF'}
                </span>
                <button className="p-1 hover:bg-gray-100 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4">
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-gray-900">{client.appointments_count || 0}</div>
                <div className="text-sm text-gray-600">Afspraken</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-gray-900">€{client.total_spent || 0}</div>
                <div className="text-sm text-gray-600">Uitgegeven</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-gray-900">
                  {client.last_visit_date ? format(new Date(client.last_visit_date), 'd MMM', { locale: nl }) : 'N.v.t.'}
                </div>
                <div className="text-sm text-gray-600">Laatste bezoek</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-gray-900">
                  {client.created_at ? `${Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))}m` : 'N.v.t.'}
                </div>
                <div className="text-sm text-gray-600">Klant sinds</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
              {client.tags?.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors min-h-[44px]">
                <Phone className="w-4 h-4" />
                Bellen
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors min-h-[44px]">
                <Mail className="w-4 h-4" />
                E-mail
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 lg:space-x-8 min-w-max">
          {[
            { id: 'overview', label: 'Overzicht', icon: FileText },
            { id: 'appointments', label: 'Afspraken', icon: Calendar },
            { id: 'trajecten', label: 'Trajecten', icon: Activity },
            { id: 'communications', label: 'Communicatie', icon: MessageSquare },
            { id: 'documents', label: 'Documenten', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 mobile-gap">
        {activeTab === 'overview' && (
          <>
            <div className="lg:col-span-8 space-y-4 lg:space-y-6">
              {/* Personal Information */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Persoonlijke informatie</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum</label>
<p>{client.date_of_birth ? format(new Date(client.date_of_birth), 'd MMMM yyyy', { locale: nl }) : 'Onbekend'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <p className="text-gray-900">{client.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Klant sinds</label>
                    <p className="text-gray-900">{client.created_at ? format(new Date(client.created_at), 'd MMMM yyyy', { locale: nl }) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
                    <p className="text-gray-900 capitalize">{client.segment || 'Standaard'}</p>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Voorkeuren</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Favoriete behandelingen</label>
                    <div className="flex flex-wrap gap-2">
                      {client.preferences?.preferred_services?.map((service: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                          {service}
                        </span>
                      )) || <p className="text-gray-500">Geen</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voorkeur medewerker</label>
                    <p className="text-gray-900">{client.preferences?.preferred_staff || 'Geen'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communicatie voorkeur</label>
                    <p className="text-gray-900 capitalize">{client.preferences?.communication_preference || 'Geen'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              {/* Notes */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Notities</h3>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">{client.notes || 'Geen notities.'}</p>
                </div>
                <button className="w-full mt-3 btn-outlined text-sm">
                  Notitie bewerken
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'appointments' && (
          <div className="lg:col-span-12">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
                <h3 className="text-lg font-semibold">Afsprakengeschiedenis</h3>
                <button className="btn-primary self-start sm:self-auto">
                  Nieuwe afspraak
                </button>
              </div>

              <div className="space-y-4">
                {mockAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {format(appointment.date, 'd', { locale: nl })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(appointment.date, 'MMM', { locale: nl })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{appointment.service}</h4>
                        <p className="text-sm text-gray-600">{appointment.duration} minuten</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-center sm:text-right">
                        <div className="font-semibold text-gray-900">€{appointment.price}</div>
                        <span className={`status-chip ${getAppointmentStatusColor(appointment.status)}`}>
                          {appointment.status === 'completed' ? 'Afgerond' : 
                           appointment.status === 'scheduled' ? 'Ingepland' : 'Geannuleerd'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="lg:col-span-12">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
                <h3 className="text-lg font-semibold">Communicatiegeschiedenis</h3>
                <button className="btn-primary self-start sm:self-auto">
                  Nieuwe communicatie
                </button>
              </div>

              <div className="space-y-4">
                {mockCommunications.map((comm) => (
                  <div key={comm.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      comm.type === 'email' ? 'bg-blue-100' :
                      comm.type === 'phone' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {comm.type === 'email' ? <Mail className="w-4 h-4" /> :
                       comm.type === 'phone' ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{comm.subject}</h4>
                        <span className="text-sm text-gray-600 mt-1 sm:mt-0">
                          {format(comm.date, 'd MMM yyyy HH:mm', { locale: nl })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{comm.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="lg:col-span-12">
            <div className="card">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
                <h3 className="text-lg font-semibold">Documenten</h3>
                <button className="btn-primary self-start sm:self-auto">
                  Document uploaden
                </button>
              </div>

              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nog geen documenten geüpload</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trajecten' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Behandelingstrajecten</h3>
            {progressLoading && <p>Trajecten laden...</p>}
            {progressError && <p>Fout bij het laden van trajecten.</p>}
            {treatmentProgress && treatmentProgress.length > 0 ? (
              <div className="space-y-4">
                {treatmentProgress.map((traject: any) => (
                  <div key={traject.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{traject.service.name}</p>
                      <p className="text-sm text-gray-600">
                        {traject.voltooide_sessies} / {traject.totaal_sessies} sessies
                      </p>
                    </div>
                    <ProgressBar value={traject.voltooide_sessies} max={traject.totaal_sessies} />
                  </div>
                ))}
              </div>
            ) : (
              <p>Deze klant heeft geen actieve behandeltrajecten.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}