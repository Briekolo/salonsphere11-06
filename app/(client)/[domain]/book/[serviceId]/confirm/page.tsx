'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/client/tenant-context';
import { useHoldSlot, useInvalidateAvailability } from '@/lib/hooks/useAvailability';
import { supabase } from '@/lib/supabase';
import { BookingService } from '@/lib/client/booking-service';
import { 
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  Euro,
  User,
  Mail,
  Phone,
  CreditCard,
  Building,
  Download,
  Send,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

export default function BookingConfirmationPage({ 
  params 
}: { 
  params: Promise<{ domain: string; serviceId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  
  // Get all booking details from URL params
  const bookingData = {
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    staffId: searchParams.get('staff') || '',
    staffName: searchParams.get('staffName') || '',
    firstName: searchParams.get('firstName') || '',
    lastName: searchParams.get('lastName') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    notes: searchParams.get('notes') || '',
    marketingOptIn: searchParams.get('marketingOptIn') === 'true',
    createAccount: searchParams.get('createAccount') === 'true'
  };
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'now' | 'later'>('later');
  
  // Hold management
  const { currentHold, confirmBooking, releaseSlot } = useHoldSlot();
  
  // Availability cache invalidation
  const { invalidateAvailability } = useInvalidateAvailability();

  useEffect(() => {
    // Validate required data
    if (!bookingData.date || !bookingData.time || !bookingData.staffId || 
        !bookingData.firstName || !bookingData.lastName || !bookingData.email || !bookingData.phone) {
      router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}`);
      return;
    }
    
    if (tenant?.id) {
      fetchDetails();
    }
  }, [tenant]);

  const fetchDetails = async () => {
    if (!tenant?.id) return;

    try {
      // Fetch service
      const { data: serviceData } = await supabase
        .from('services')
        .select('*')
        .eq('id', resolvedParams.serviceId)
        .eq('tenant_id', tenant.id)
        .single();

      setService(serviceData);

      // Fetch staff if not "any"
      if (bookingData.staffId && bookingData.staffId !== 'any') {
        const { data: staffData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('id', bookingData.staffId)
          .eq('tenant_id', tenant.id)
          .single();

        setStaff(staffData);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!tenant?.id || !service) return;
    
    setSubmitting(true);
    
    try {
      // Create or find the client
      const client = await BookingService.createOrFindClient({
        tenantId: tenant.id,
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        notes: bookingData.notes,
        marketingConsent: bookingData.marketingOptIn
      });
      
      // Release any existing hold
      if (currentHold) {
        try {
          await confirmBooking({
            holdId: currentHold.id,
            clientData: {
              first_name: bookingData.firstName,
              last_name: bookingData.lastName,
              email: bookingData.email,
              phone: bookingData.phone,
              notes: bookingData.notes
            }
          });
        } catch (holdError) {
          console.log('Hold confirmation failed, proceeding with direct booking creation');
        }
      }
      
      // Create the actual booking
      const scheduledAt = new Date(`${bookingData.date}T${bookingData.time}`);
      
      const booking = await BookingService.createBooking({
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: service.id,
        staffId: bookingData.staffId === 'any' ? undefined : bookingData.staffId,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: service.duration_minutes,
        notes: bookingData.notes,
        createInvoice: true, // Automatically create invoice for bookings
        sendConfirmationEmail: true // Send booking confirmation email
      });
      
      setBookingId(booking.id);
      setBookingComplete(true);
      
      // Invalidate availability cache to remove the booked time slot
      invalidateAvailability(tenant.id, bookingData.date);
      
      // TODO: Send confirmation email using Supabase Edge Functions
      // TODO: Add email reminder scheduling
      
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Er is een fout opgetreden bij het maken van de afspraak. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minuten`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} uur ${mins} minuten` : `${hours} uur`;
  };

  const downloadCalendarEvent = async () => {
    if (!service || !bookingId || !tenant) return;
    
    try {
      const booking = await BookingService.getBooking(bookingId);
      const icsContent = BookingService.generateCalendarEvent(booking, tenant);
      
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `afspraak-${bookingId}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating calendar event:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-gray-600">Bevestiging laden...</p>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ABD37A] rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-medium text-[#010009] mb-2" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
              Afspraak bevestigd!
            </h1>
            
            <p className="text-gray-600 mb-6">
              We hebben een bevestiging naar {bookingData.email} gestuurd.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Wanneer</p>
                  <p className="font-medium text-[#010009]">
                    {format(new Date(bookingData.date), 'd MMMM yyyy', { locale: nl })} om {bookingData.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wat</p>
                  <p className="font-medium text-[#010009]">{service?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bij</p>
                  <p className="font-medium text-[#010009]">
                    {staff ? `${staff.first_name} ${staff.last_name}` : (bookingData.staffName || 'Eerste beschikbare')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={downloadCalendarEvent}
                className="w-full px-4 py-3 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Toevoegen aan kalender
              </button>
              
              <button
                onClick={() => router.push(`/${resolvedParams.domain}`)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Terug naar homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {!bookingComplete && (
              <button
                onClick={handleBack}
                className="mb-3 flex items-center gap-2 text-gray-600 hover:text-[#010009] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Terug</span>
              </button>
            )}
            
            <h1 className="text-2xl font-medium text-[#010009]" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
              Bevestig uw afspraak
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Stap 5 van 5 - Controleer uw gegevens en bevestig
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
              <h2 className="text-lg font-medium text-[#010009] mb-6" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
                Afspraakdetails
              </h2>
              
              <div className="space-y-4">
                {/* Service & Staff */}
                <div className="pb-4 border-b">
                  <h3 className="font-medium text-[#010009] mb-3">{service?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>
                      {staff ? `${staff.first_name} ${staff.last_name}` : (bookingData.staffName || 'Eerste beschikbare medewerker')}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="pb-4 border-b">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Datum</p>
                        <p className="font-medium text-[#010009]">
                          {format(new Date(bookingData.date), 'd MMMM yyyy', { locale: nl })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Tijd</p>
                        <p className="font-medium text-[#010009]">{bookingData.time}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Duur: {service && formatDuration(service.duration_minutes)}
                  </p>
                </div>

                {/* Contact Details */}
                <div className="pb-4 border-b">
                  <h3 className="font-medium text-[#010009] mb-3">Uw gegevens</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{bookingData.firstName} {bookingData.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{bookingData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{bookingData.phone}</span>
                    </div>
                  </div>
                  {bookingData.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Opmerkingen:</p>
                      <p className="text-sm">{bookingData.notes}</p>
                    </div>
                  )}
                </div>

                {/* Payment Selection */}
                <div>
                  <h3 className="font-medium text-[#010009] mb-3">Betaalwijze</h3>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="later"
                        checked={selectedPaymentMethod === 'later'}
                        onChange={() => setSelectedPaymentMethod('later')}
                        className="mt-0.5 w-4 h-4 text-[#02011F] border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">Betaal in de salon</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          U betaalt bij aankomst in de salon
                        </p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
                      <input
                        type="radio"
                        name="payment"
                        value="now"
                        checked={selectedPaymentMethod === 'now'}
                        onChange={() => setSelectedPaymentMethod('now')}
                        disabled
                        className="mt-0.5 w-4 h-4 text-[#02011F] border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">Betaal nu online</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Binnenkort</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Veilig betalen met iDEAL, creditcard of PayPal
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#92400E] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-[#92400E]">Annuleringsbeleid</h3>
                  <p className="text-sm text-[#92400E] mt-1">
                    U kunt deze afspraak kosteloos annuleren tot 24 uur voor de geplande tijd. 
                    Bij latere annulering kunnen kosten in rekening worden gebracht.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
              <h3 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
                Prijsoverzicht
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#010009]">{service?.name}</p>
                    <p className="text-sm text-gray-600">
                      {service && formatDuration(service.duration_minutes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{service?.price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-[#010009]">Totaal</p>
                    <div className="flex items-center gap-1">
                      <Euro className="w-5 h-5 text-[#010009]" />
                      <span className="text-xl font-medium text-[#010009]">
                        {service?.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="w-full mt-6 px-6 py-3 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Bevestigen...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Afspraak bevestigen
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                Door te bevestigen gaat u akkoord met onze{' '}
                <a href="#" className="underline">algemene voorwaarden</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}