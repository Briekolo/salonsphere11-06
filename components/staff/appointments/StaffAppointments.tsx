'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/lib/hooks/useStaffAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  User,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getBookingStatus, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, BookingStatus } from '@/types/booking';

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  status?: string | null;
  client: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  service: {
    name: string;
    price: number;
    color?: string | null;
  };
}

export function StaffAppointments() {
  const router = useRouter();
  const { user, hasPermission, loading: authLoading } = useStaffAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('week');

  // Check permissions
  const canViewAll = hasPermission('can_view_all_appointments');
  const canEditAll = hasPermission('can_edit_all_appointments');

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    
    switch (filterPeriod) {
      case 'today':
        return {
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999))
        };
      case 'week':
        return { start, end };
      case 'all':
        return { start: null, end: null };
      default:
        return { start, end };
    }
  };

  // Fetch appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['staff-appointments', user?.id, filterStatus, filterPeriod, canViewAll],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          notes,
          status,
          client:clients!client_id (
            first_name,
            last_name,
            email,
            phone
          ),
          service:services!service_id (
            name,
            price,
            color
          )
        `)
        .order('scheduled_at', { ascending: true });

      // Apply staff filter if user can't view all
      if (!canViewAll) {
        query = query.eq('staff_id', user.id);
      } else {
        query = query.eq('tenant_id', user.tenant_id);
      }

      // Apply date range filter
      if (start) {
        query = query.gte('scheduled_at', start.toISOString());
      }
      if (end) {
        query = query.lte('scheduled_at', end.toISOString());
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading appointments:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  const getStatusIcon = (appointment: Appointment) => {
    const status = getBookingStatus(appointment);
    const colors = BOOKING_STATUS_COLORS[status];
    
    switch (status) {
      case 'completed':
        return <CheckCircle className={`h-4 w-4 ${colors.icon}`} />;
      case 'cancelled':
        return <XCircle className={`h-4 w-4 ${colors.icon}`} />;
      case 'no_show':
        return <AlertCircle className={`h-4 w-4 ${colors.icon}`} />;
      default:
        return <Clock className={`h-4 w-4 ${colors.icon}`} />;
    }
  };

  const loading = authLoading || appointmentsLoading;

  if (loading) {
    return (
      <div className="mobile-p space-y-4 lg:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {canViewAll ? 'Alle Afspraken' : 'Mijn Afspraken'}
          </h1>
          <p className="text-gray-600 mt-1">
            {appointments.length} afspraken gevonden
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periode
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="today">Vandaag</option>
              <option value="week">Deze week</option>
              <option value="all">Alle afspraken</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Alle statussen</option>
              <option value="scheduled">Gepland</option>
              <option value="confirmed">Bevestigd</option>
              <option value="completed">Voltooid</option>
              <option value="cancelled">Geannuleerd</option>
              <option value="no_show">Niet verschenen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Geen afspraken gevonden
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Probeer de filters aan te passen
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/staff/appointments/${appointment.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: appointment.service?.color || '#ccc' }}
                      />
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appointment)}
                        <span className="text-sm font-medium text-gray-900">
                          {BOOKING_STATUS_LABELS[getBookingStatus(appointment)]}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.client?.first_name || 'Onbekend'} {appointment.client?.last_name || ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.service?.name || 'Onbekende service'}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(appointment.scheduled_at), 'EEEE d MMMM', { locale: nl })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(appointment.scheduled_at), 'HH:mm')} - 
                            {appointment.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}