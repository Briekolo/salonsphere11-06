'use client';

import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/lib/hooks/useStaffAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getBookingStatus, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types/booking';

interface TodayAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  status?: string | null;
  client: {
    first_name: string;
    last_name: string;
  };
  service: {
    name: string;
    color?: string | null;
  };
}

interface WeekStats {
  totalAppointments: number;
  completedAppointments: number;
  totalHours: number;
  totalClients: number;
}

export function StaffDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission } = useStaffAuth();

  // Check permissions to determine if we can view all appointments
  const canViewAll = hasPermission('can_view_all_appointments');

  // Fetch today's appointments using same permission logic as agenda
  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['staff-today-appointments', user?.id, canViewAll],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      let query = supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          notes,
          client:clients!client_id (
            first_name,
            last_name
          ),
          service:services!service_id (
            name,
            color
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .gte('scheduled_at', startOfToday.toISOString())
        .lte('scheduled_at', endOfToday.toISOString())
        .order('scheduled_at', { ascending: true });

      // Apply staff filtering based on permissions (same as agenda)
      if (!canViewAll) {
        query = query.eq('staff_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading appointments:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id && !!user?.tenant_id
  });

  // Fetch week statistics using the same logic as agenda
  const { data: weekStats } = useQuery({
    queryKey: ['staff-week-stats', user?.id, canViewAll],
    queryFn: async () => {
      if (!user?.id) return {
        totalAppointments: 0,
        completedAppointments: 0,
        totalHours: 0,
        totalClients: 0
      };

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End week on Sunday

      let query = supabase
        .from('bookings')
        .select('id, scheduled_at, duration_minutes, client_id')
        .eq('tenant_id', user.tenant_id)
        .gte('scheduled_at', weekStart.toISOString())
        .lte('scheduled_at', weekEnd.toISOString());

      // Apply staff filtering based on permissions (same as agenda)
      if (!canViewAll) {
        query = query.eq('staff_id', user.id);
      }

      const { data: appointments } = await query;

      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(a => 
        new Date(a.scheduled_at) < new Date()
      ).length || 0;
      const totalHours = appointments?.reduce((sum, a) => 
        sum + (a.duration_minutes || 0) / 60, 0
      ) || 0;
      const uniqueClients = new Set(appointments?.map(a => a.client_id) || []).size;

      return {
        totalAppointments,
        completedAppointments,
        totalHours: Math.round(totalHours),
        totalClients: uniqueClients
      };
    },
    enabled: !!user?.id && !!user?.tenant_id
  });

  const getStatusBadge = (appointment: TodayAppointment) => {
    const status = getBookingStatus(appointment);
    const colors = BOOKING_STATUS_COLORS[status];
    const label = BOOKING_STATUS_LABELS[status];
    
    // Check if appointment is coming up soon
    const appointmentTime = new Date(appointment.scheduled_at);
    const now = new Date();
    const minutesUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (status === 'scheduled' && minutesUntil > 0 && minutesUntil <= 30) {
      return <span className="status-chip bg-red-100 text-red-800">Binnenkort</span>;
    }
    
    return <span className={`status-chip ${colors.bg} ${colors.text}`}>{label}</span>;
  };

  const loading = authLoading || appointmentsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welkom terug, {user?.first_name || 'Medewerker'}
          </h1>
          <p className="text-gray-600 mt-1">
            {canViewAll 
              ? `Vandaag zijn er ${todayAppointments.length} afspraken gepland in de salon`
              : `Vandaag heb je ${todayAppointments.length} afspraken gepland`
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => router.push('/staff/agenda')}
            className="btn-primary"
          >
            <Calendar className="h-4 w-4" />
            Naar Agenda
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon bg-icon-blue-bg">
            <div className="text-icon-blue"><Calendar className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Deze Week</p>
            <p className="metric-value">{weekStats?.totalAppointments || 0}</p>
            <p className="metric-subtitle">afspraken gepland</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-icon-green-bg">
            <div className="text-icon-green"><CheckCircle className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Voltooid</p>
            <p className="metric-value">{weekStats?.completedAppointments || 0}</p>
            <p className="metric-subtitle">van {weekStats?.totalAppointments || 0} afspraken</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-icon-purple-bg">
            <div className="text-icon-purple"><Clock className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Gewerkte Uren</p>
            <p className="metric-value">{weekStats?.totalHours || 0}h</p>
            <p className="metric-subtitle">deze week</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-icon-orange-bg">
            <div className="text-icon-orange"><Users className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <p className="metric-title">Klanten</p>
            <p className="metric-value">{weekStats?.totalClients || 0}</p>
            <p className="metric-subtitle">unieke klanten</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-heading">Vandaag&apos;s Planning</h2>
            <p className="text-sm text-gray-600">
              {format(new Date(), 'EEEE d MMMM', { locale: nl })}
            </p>
          </div>
          <button
            onClick={() => router.push('/staff/agenda')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            Volledige agenda
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Geen afspraken vandaag</h3>
              <p className="mt-1 text-sm text-gray-500">
                Je hebt een rustige dag vandaag!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: appointment.service?.color || '#ccc' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.client?.first_name || 'Onbekend'} {appointment.client?.last_name || ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.service?.name || 'Onbekende service'} • {appointment.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(appointment.scheduled_at), 'HH:mm')}
                      </p>
                      {getStatusBadge(appointment)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-heading mb-4">Snelle Acties</h2>
        <p className="text-sm text-gray-600 mb-4">
          Handige shortcuts voor dagelijkse taken
        </p>
        <div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/staff/appointments')}
              className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] text-left"
            >
              <Clock className="w-5 h-5 text-icon-blue mr-3 flex-shrink-0" />
              <div>
                <span className="font-medium">Afspraken Beheren</span>
                <p className="text-sm text-gray-600">Bekijk en bewerk je afspraken</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/staff/clients')}
              className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] text-left"
            >
              <Users className="w-5 h-5 text-icon-green mr-3 flex-shrink-0" />
              <div>
                <span className="font-medium">Klanten Bekijken</span>
                <p className="text-sm text-gray-600">Bekijk klantinformatie</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/staff/profile')}
              className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] text-left"
            >
              <AlertCircle className="w-5 h-5 text-icon-orange mr-3 flex-shrink-0" />
              <div>
                <span className="font-medium">Profiel Bijwerken</span>
                <p className="text-sm text-gray-600">Beheer je profiel en voorkeuren</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}