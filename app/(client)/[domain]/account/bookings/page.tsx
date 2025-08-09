'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuthContext } from '@/components/client/auth/ClientAuthProvider';
import { useTenant } from '@/lib/client/tenant-context';
import { supabase } from '@/lib/supabase';
import { BookingService } from '@/lib/client/booking-service';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Euro,
  Loader2,
  CalendarX,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  service_id: string;
  staff_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  price?: number;
  notes?: string | null;
  services: {
    name: string;
    duration_minutes: number;
    price?: number;
  } | null;
  staff?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function BookingsPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { client, loading: authLoading, isAuthenticated } = useClientAuthContext();
  const { tenant } = useTenant();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/${resolvedParams.domain}/auth/login`);
    }
  }, [authLoading, isAuthenticated, router, resolvedParams.domain]);

  useEffect(() => {
    if (client && tenant) {
      fetchBookings();
    }
  }, [client, tenant]);

  const fetchBookings = async () => {
    if (!client) return;
    try {
      const data = await BookingService.getClientBookings(client.id);
      setBookings((data as unknown as Booking[]) || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Weet u zeker dat u deze afspraak wilt annuleren?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      
      await fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Er is een fout opgetreden bij het annuleren van de afspraak.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E3ECFB] rounded-xl mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#7091D9]" />
          </div>
          <p className="text-base text-gray-600">Afspraken laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !client) {
    return null;
  }

  const now = new Date();
  const upcomingBookings = bookings.filter(b => {
    const bookingDateTime = new Date(b.scheduled_at);
    return bookingDateTime >= now && b.status !== 'cancelled';
  });
  const pastBookings = bookings.filter(b => {
    const bookingDateTime = new Date(b.scheduled_at);
    return bookingDateTime < now || b.status === 'cancelled';
  });

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Bevestigd', className: 'bg-green-100 text-green-700' };
      case 'pending':
        return { text: 'In afwachting', className: 'bg-yellow-100 text-yellow-700' };
      case 'cancelled':
        return { text: 'Geannuleerd', className: 'bg-red-100 text-red-700' };
      case 'completed':
        return { text: 'Voltooid', className: 'bg-gray-100 text-gray-700' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href={`/${resolvedParams.domain}/account`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#010009] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Terug naar account</span>
      </Link>

      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
        <h1 className="text-2xl sm:text-3xl font-medium text-[#010009] mb-2" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
          Mijn afspraken
        </h1>
        <p className="text-gray-600">
          Bekijk en beheer uw afspraken bij {tenant?.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 max-w-sm">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'upcoming'
              ? 'bg-white text-[#010009] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Komende ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'past'
              ? 'bg-white text-[#010009] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Afgelopen ({pastBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#7091D9]" />
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl mb-4">
            <CalendarX className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#010009] mb-2">
            {activeTab === 'upcoming' ? 'Geen komende afspraken' : 'Geen afgelopen afspraken'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'upcoming' 
              ? 'U heeft momenteel geen geplande afspraken.'
              : 'U heeft nog geen eerdere afspraken gehad.'}
          </p>
          <Link
            href={`/${resolvedParams.domain}/book`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#02011F] text-white font-medium rounded-xl hover:opacity-90 transition-all duration-200"
          >
            <Calendar className="h-5 w-5" />
            <span>Nieuwe afspraak boeken</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => {
            const statusBadge = getStatusBadge(booking.status);
            const bookingDateTime = new Date(booking.scheduled_at);
            const canCancel = booking.status !== 'cancelled' && 
                            booking.status !== 'completed' && 
                            bookingDateTime > now;
            
            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-6 hover:shadow-md transition-all duration-200"
                style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-medium text-[#010009]" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        {booking.services?.name || 'Behandeling'}
                      </h3>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(bookingDateTime, 'EEEE d MMMM yyyy', { locale: nl })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(bookingDateTime, 'HH:mm')} - 
                          {format(new Date(bookingDateTime.getTime() + booking.duration_minutes * 60000), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>
                          {booking.staff?.first_name} {booking.staff?.last_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium">
                          €{((booking.price ?? booking.services?.price ?? 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notities:</span> {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        Annuleren
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}