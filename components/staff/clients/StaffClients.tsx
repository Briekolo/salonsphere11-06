'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/lib/hooks/useStaffAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Phone, 
  Mail,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  notes?: string;
  created_at: string;
  last_appointment?: {
    scheduled_at: string;
    service: {
      name: string;
    };
  };
  total_appointments: number;
}

export function StaffClients() {
  const router = useRouter();
  const { user, hasPermission, loading: authLoading } = useStaffAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user has permission to view clients
  const canViewClients = hasPermission('can_view_clients');

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['staff-clients', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id || !canViewClients) return [];
      
      let query = supabase
        .from('clients')
        .select(`
          *,
          bookings!client_id (
            scheduled_at,
            service:services!service_id (
              name
            )
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      // Add search filter if query exists
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading clients:', error);
        return [];
      }

      // Process clients to include appointment stats
      return (data || []).map((client: any) => {
        const appointments = client.bookings || [];
        const sortedAppointments = appointments.sort((a: any, b: any) => 
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
        );

        return {
          ...client,
          last_appointment: sortedAppointments[0],
          total_appointments: appointments.length
        };
      });
    },
    enabled: !!user?.id && canViewClients
  });

  const loading = authLoading || clientsLoading;

  if (loading) {
    return (
      <div className="mobile-p space-y-4 lg:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canViewClients) {
    return (
      <div className="mobile-p space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mijn Klanten</h1>
          <p className="text-gray-600 mt-1">
            Bekijk klantinformatie en historie
          </p>
        </div>

        <div className="card">
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Geen toegang</h3>
            <p className="mt-1 text-sm text-gray-500">
              Je hebt geen toestemming om klantgegevens te bekijken
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mijn Klanten</h1>
          <p className="text-gray-600 mt-1">
            {clients.length} klanten gevonden
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op naam, email of telefoon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="card">
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery ? 'Geen klanten gevonden' : 'Nog geen klanten'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Probeer een andere zoekterm' : 'Klanten verschijnen hier zodra ze een afspraak hebben gemaakt'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clients.map((client) => (
              <div
                key={client.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/staff/clients/${client.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {client.first_name} {client.last_name}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{client.total_appointments} afspraken</span>
                      </div>
                      {client.last_appointment && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Laatste: {format(new Date(client.last_appointment.scheduled_at), 'd MMM', { locale: nl })}
                          </span>
                        </div>
                      )}
                    </div>
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