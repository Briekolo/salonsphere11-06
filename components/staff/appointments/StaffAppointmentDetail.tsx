'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/lib/hooks/useStaffAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Calendar, 
  Clock, 
  User,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getBookingStatus, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, BookingStatus } from '@/types/booking';

interface AppointmentDetail {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  status?: string | null;
  created_at: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    color?: string | null;
    description?: string;
  };
  staff: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface StaffAppointmentDetailProps {
  appointmentId: string;
}

export function StaffAppointmentDetail({ appointmentId }: StaffAppointmentDetailProps) {
  const router = useRouter();
  const { user, hasPermission, loading: authLoading } = useStaffAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<BookingStatus>('scheduled');

  // Check permissions
  const canEditNotes = hasPermission('can_add_appointment_notes');
  const canEditAll = hasPermission('can_edit_all_appointments');

  // Fetch appointment details
  const { data: appointment, isLoading: appointmentLoading } = useQuery({
    queryKey: ['staff-appointment-detail', appointmentId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      let query = supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          notes,
          status,
          created_at,
          client:clients!client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          service:services!service_id (
            id,
            name,
            price,
            color,
            description
          ),
          staff:users!staff_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', appointmentId)
        .single();

      const { data, error } = await query;

      if (error) {
        console.error('Error loading appointment:', error);
        return null;
      }

      // Check if staff member can view this appointment
      if (!canEditAll && data?.staff?.id !== user.id) {
        router.push('/staff/appointments');
        return null;
      }

      return data as AppointmentDetail;
    },
    enabled: !!user?.id && !!appointmentId
  });

  // Initialize form state when appointment loads
  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '');
      setStatus(getBookingStatus(appointment));
    }
  }, [appointment]);

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ notes, status }: { notes: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          notes: notes.trim() || null,
          status
        })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Refresh the appointment data
      queryClient.invalidateQueries({ queryKey: ['staff-appointment-detail', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      alert('Er is een fout opgetreden bij het bijwerken van de afspraak');
    }
  });

  const handleSave = () => {
    updateAppointmentMutation.mutate({ notes, status });
  };

  const handleCancel = () => {
    if (appointment) {
      setNotes(appointment.notes || '');
      setStatus(getBookingStatus(appointment));
    }
    setIsEditing(false);
  };

  const getStatusIcon = (status: BookingStatus) => {
    const colors = BOOKING_STATUS_COLORS[status];
    
    switch (status) {
      case 'completed':
        return <CheckCircle className={`h-5 w-5 ${colors.icon}`} />;
      case 'cancelled':
        return <XCircle className={`h-5 w-5 ${colors.icon}`} />;
      case 'no_show':
        return <AlertCircle className={`h-5 w-5 ${colors.icon}`} />;
      default:
        return <Clock className={`h-5 w-5 ${colors.icon}`} />;
    }
  };

  const loading = authLoading || appointmentLoading;

  if (loading) {
    return (
      <div className="mobile-p space-y-4 lg:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mobile-p space-y-4 lg:space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Afspraak niet gevonden</h2>
          <p className="text-gray-600 mt-2">Deze afspraak bestaat niet of u heeft geen toegang.</p>
          <button
            onClick={() => router.push('/staff/appointments')}
            className="mt-4 btn-primary"
          >
            Terug naar afspraken
          </button>
        </div>
      </div>
    );
  }

  const appointmentStatus = getBookingStatus(appointment);
  const statusColors = BOOKING_STATUS_COLORS[appointmentStatus];

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/staff/appointments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Afspraak Details
          </h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(appointment.scheduled_at), 'EEEE d MMMM yyyy', { locale: nl })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Afspraak Informatie</h2>
              <div className="flex items-center gap-2">
                {getStatusIcon(appointmentStatus)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                  {BOOKING_STATUS_LABELS[appointmentStatus]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appointment.service?.color || '#ccc' }}
                  />
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium">{appointment.service?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Tijd</p>
                    <p className="font-medium">
                      {format(new Date(appointment.scheduled_at), 'HH:mm')} - {appointment.duration_minutes} min
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Medewerker</p>
                    <p className="font-medium">
                      {appointment.staff?.first_name} {appointment.staff?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Aangemaakt</p>
                    <p className="font-medium">
                      {format(new Date(appointment.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {appointment.service?.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Service beschrijving</p>
                <p className="text-sm mt-1">{appointment.service.description}</p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          {(canEditNotes || appointment.notes) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Notities</h2>
                {canEditNotes && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary btn-sm"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Bewerken
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Voeg notities toe voor deze afspraak..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                  />
                  
                  {canEditAll && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as BookingStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="scheduled">Gepland</option>
                        <option value="confirmed">Bevestigd</option>
                        <option value="completed">Voltooid</option>
                        <option value="cancelled">Geannuleerd</option>
                        <option value="no_show">Niet verschenen</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={updateAppointmentMutation.isPending}
                      className="btn-primary btn-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateAppointmentMutation.isPending ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-secondary btn-sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {appointment.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">Geen notities toegevoegd</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Klant Informatie</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {appointment.client?.first_name} {appointment.client?.last_name}
                  </p>
                </div>
              </div>
              
              {appointment.client?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a 
                      href={`mailto:${appointment.client.email}`}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      {appointment.client.email}
                    </a>
                  </div>
                </div>
              )}
              
              {appointment.client?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Telefoon</p>
                    <a 
                      href={`tel:${appointment.client.phone}`}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      {appointment.client.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Service Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Service Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Prijs</p>
                <p className="text-lg font-semibold text-green-600">
                  €{appointment.service?.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duur</p>
                <p className="font-medium">{appointment.duration_minutes} minuten</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}