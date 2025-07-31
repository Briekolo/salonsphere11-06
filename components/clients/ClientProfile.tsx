'use client'

import { useState } from 'react'
import { ArrowLeft, Phone, Mail, Calendar, Star, Edit, Trash2, MessageSquare, FileText, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '@/lib/services/clientService';
import { useClientById } from '@/lib/hooks/useClients';
import { useClientAppointments } from '@/lib/hooks/useBookings';
import { useToast } from '@/components/providers/ToastProvider';
import { ClientStatusBadge } from './ClientStatusBadge';
import { ClientStatus } from '@/lib/services/clientStatusService';
import { handleEmailClick, handlePhoneClick } from '@/lib/utils/emailUtils';

interface ClientProfileProps {
  clientId: string
  onBack: () => void
}


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
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const { showToast } = useToast()

  const { data: client, isLoading: clientLoading, error: clientError } = useClientById(clientId);
  const { data: appointments, isLoading: appointmentsLoading, error: appointmentsError } = useClientAppointments(clientId);

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

  const getAppointmentStatusColor = (isPaid: boolean) => {
    return isPaid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Klantprofiel</h1>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <button className="btn-outlined flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]">
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Bericht</span>
            <span className="xs:hidden">Bericht</span>
          </button>
          <button className="btn-outlined flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Afspraak</span>
            <span className="xs:hidden">Afspraak</span>
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            {isEditing ? 'Opslaan' : 'Bewerken'}
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className="relative self-center sm:self-start">
            <img 
              src={client.avatar_url || `https://ui-avatars.com/api/?name=${client.first_name}+${client.last_name}`}
              alt={`${client.first_name} ${client.last_name}`}
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover"
            />
            {client.tags?.includes('VIP') && (
              <div className="absolute -top-2 -right-2 w-6 h-6 lg:w-8 lg:h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 lg:w-4 lg:h-4 text-white fill-current" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 sm:mb-4">
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {client.first_name} {client.last_name}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">{client.email}</p>
                <p className="text-sm sm:text-base text-gray-600">{client.phone}</p>
              </div>

              <div className="flex items-center justify-center sm:justify-start lg:justify-start gap-2 mt-3 sm:mt-4 lg:mt-0">
                <ClientStatusBadge 
                  status={(client.status as ClientStatus) || 'inactive'} 
                  showTooltip={true}
                  className="text-xs sm:text-sm"
                />
                <button className="p-1 hover:bg-gray-100 rounded min-h-[32px] min-w-[32px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center">
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
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
                  {(() => {
                    if (!appointments || appointments.length === 0) return 'N.v.t.';
                    
                    // Filter past appointments and sort by date (most recent first)
                    const pastAppointments = appointments
                      .filter(apt => new Date(apt.scheduled_at) < new Date())
                      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
                    
                    if (pastAppointments.length === 0) return 'N.v.t.';
                    
                    return format(new Date(pastAppointments[0].scheduled_at), 'd MMM', { locale: nl });
                  })()}
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
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors min-h-[44px]"
                onClick={() => {
                  handlePhoneClick(client.phone || '', {
                    showToast,
                    debugMode: true
                  })
                }}
              >
                <Phone className="w-4 h-4" />
                Bellen
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors min-h-[44px]"
                onClick={async () => {
                  await handleEmailClick(client.email || '', {
                    showToast,
                    debugMode: true
                  })
                }}
              >
                <Mail className="w-4 h-4" />
                E-mail
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex min-w-max">
          {[
            { id: 'overview', label: 'Overzicht', icon: FileText },
            { id: 'appointments', label: 'Afspraken', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap min-h-[44px] flex-1 ${
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

              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600">Afspraken laden...</div>
                </div>
              ) : appointmentsError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-red-600">Fout bij het laden van afspraken</div>
                </div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Geen afspraken gevonden voor deze klant</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {format(new Date(appointment.scheduled_at), 'd', { locale: nl })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(appointment.scheduled_at), 'MMM', { locale: nl })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(appointment.scheduled_at), 'HH:mm', { locale: nl })}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.services?.name || 'Onbekende service'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {appointment.duration_minutes || appointment.services?.duration_minutes || 0} minuten
                          </p>
                          {appointment.users && (
                            <p className="text-xs text-gray-500">
                              Met {appointment.users.first_name} {appointment.users.last_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-center sm:text-right">
                          <div className="font-semibold text-gray-900">
                            €{appointment.price || appointment.services?.price || 0}
                          </div>
                          <span className={`status-chip ${getAppointmentStatusColor(appointment.is_paid)}`}>
                            {appointment.is_paid ? 'Betaald' : 'Nog niet betaald'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  )
}