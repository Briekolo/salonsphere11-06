'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/client/tenant-context';
import { useHoldSlot, useHoldCountdown } from '@/lib/hooks/useAvailability';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  User,
  Timer,
  AlertCircle,
  Calendar,
  Clock,
  Euro
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

export default function ClientDetailsPage({ 
  params 
}: { 
  params: Promise<{ domain: string; serviceId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  
  // Get booking details from URL params
  const bookingDate = searchParams.get('date') || '';
  const bookingTime = searchParams.get('time') || '';
  const staffId = searchParams.get('staff') || '';
  const staffName = searchParams.get('staffName') || '';
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    marketingOptIn: false,
    createAccount: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Hold management
  const { currentHold, releaseSlot } = useHoldSlot();
  const { formattedTime, isExpired } = useHoldCountdown(currentHold?.expires_at || null);

  useEffect(() => {
    if (!bookingDate || !bookingTime || !staffId) {
      // Missing required params, redirect back
      router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}`);
      return;
    }
    
    if (tenant?.id) {
      fetchDetails();
    }
  }, [tenant, bookingDate, bookingTime, staffId]);

  useEffect(() => {
    // Check if hold expired
    if (isExpired && currentHold) {
      alert('Uw tijdslot is verlopen. Kies alstublieft een nieuwe tijd.');
      router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}/time`);
    }
  }, [isExpired, currentHold]);

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
      if (staffId && staffId !== 'any') {
        const { data: staffData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('id', staffId)
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Voornaam is verplicht';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Achternaam is verplicht';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ongeldig e-mailadres';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefoonnummer is verplicht';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Ongeldig telefoonnummer';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Navigate to confirmation page with all data
    const queryParams = new URLSearchParams({
      date: bookingDate,
      time: bookingTime,
      staff: staffId,
      staffName: staffName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      notes: formData.notes,
      marketingOptIn: formData.marketingOptIn.toString(),
      createAccount: formData.createAccount.toString()
    });
    
    router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}/confirm?${queryParams.toString()}`);
  };

  const handleBack = () => {
    if (currentHold) {
      releaseSlot(currentHold.id);
    }
    router.back();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minuten`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} uur ${mins} minuten` : `${hours} uur`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={handleBack}
              className="mb-3 flex items-center gap-2 text-gray-600 hover:text-[#010009] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Terug</span>
            </button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-medium text-[#010009]" style={{ fontFamily: 'Aeonik, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                  Uw gegevens
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Stap 4 van 5 - Vul uw contactgegevens in
                </p>
              </div>
              
              {/* Hold timer */}
              {currentHold && !isExpired && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-[#92400E]" />
                    <div>
                      <p className="text-xs font-medium text-[#92400E]">Tijdslot gereserveerd</p>
                      <p className="text-sm font-bold text-[#92400E]">{formattedTime}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-4 flex items-center justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 5 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${step <= 4 ? 'bg-[#02011F] text-white' : 'bg-gray-100 text-gray-600'}
                    `}
                  >
                    {step < 4 ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`flex-1 h-0.5 ${step < 4 ? 'bg-[#02011F]' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
              <h2 className="text-lg font-medium text-[#010009] mb-4 sm:mb-6" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
                Contactgegevens
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* First Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Voornaam
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`
                      w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent min-h-[44px] text-base
                      ${errors.firstName ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Jan"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Achternaam
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`
                      w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent min-h-[44px] text-base
                      ${errors.lastName ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Jansen"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`
                      w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent min-h-[44px] text-base
                      ${errors.email ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="jan.jansen@email.nl"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Telefoonnummer
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`
                      w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent min-h-[44px] text-base
                      ${errors.phone ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="06 12345678"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4 sm:mt-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  Opmerkingen (optioneel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-transparent min-h-[44px] text-base"
                  placeholder="Eventuele speciale verzoeken of opmerkingen..."
                />
              </div>

              {/* Options */}
              <div className="mt-4 sm:mt-6 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.marketingOptIn}
                    onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-[#02011F] border-gray-300 rounded focus:ring-[#02011F] min-h-[16px] min-w-[16px]"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    Ik wil graag op de hoogte blijven van nieuws en aanbiedingen
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.createAccount}
                    onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-[#02011F] border-gray-300 rounded focus:ring-[#02011F] min-h-[16px] min-w-[16px]"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    Maak een account aan voor sneller boeken in de toekomst
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 px-6 py-3 bg-[#02011F] text-white rounded-lg font-medium hover:bg-opacity-90 active:bg-opacity-80 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    Doorgaan naar bevestiging
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
              <h3 className="text-lg font-medium text-[#010009] mb-3 sm:mb-4" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
                Uw afspraak
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                {/* Service */}
                <div>
                  <p className="text-sm text-gray-600">Behandeling</p>
                  <p className="font-medium text-[#010009]">{service?.name}</p>
                </div>

                {/* Staff */}
                <div>
                  <p className="text-sm text-gray-600">Medewerker</p>
                  <p className="font-medium text-[#010009]">
                    {staff ? `${staff.first_name} ${staff.last_name}` : (staffName || 'Eerste beschikbare')}
                  </p>
                </div>

                {/* Date & Time */}
                <div>
                  <p className="text-sm text-gray-600">Datum & Tijd</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-[#010009]">
                      {bookingDate && format(new Date(bookingDate), 'd MMMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-[#010009]">{bookingTime}</p>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-sm text-gray-600">Duur</p>
                  <p className="font-medium text-[#010009]">
                    {service && formatDuration(service.duration_minutes)}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Totaal</p>
                    <div className="flex items-center gap-1">
                      <Euro className="w-4 h-4 text-gray-600" />
                      <p className="text-lg font-medium text-[#010009]">
                        {service?.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}