'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/client/tenant-context';
import { useAvailableSlots, useHoldSlot, useStaffAvailability, useHoldCountdown } from '@/lib/hooks/useAvailability';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay
} from 'date-fns';
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

export default function BookingCalendarPage({ 
  params 
}: { 
  params: Promise<{ domain: string; serviceId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  // Get staff ID from URL params
  const staffIdFromUrl = searchParams.get('staff');
  const isAnyStaff = !staffIdFromUrl || staffIdFromUrl === 'any';
  const actualStaffId = staffIdFromUrl && staffIdFromUrl !== 'any' ? staffIdFromUrl : undefined;

  // Fetch service and staff details
  useEffect(() => {
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

      // Fetch staff if specific staff selected
      if (actualStaffId) {
        const { data: staffData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('id', actualStaffId)
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

  // Get staff availability for the month
  const { data: monthAvailability } = useStaffAvailability(
    tenant?.id || '',
    format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
    actualStaffId
  );

  // Get available slots for selected date
  const { 
    data: availableSlots, 
    isLoading: slotsLoading,
    refetch: refetchSlots
  } = useAvailableSlots(
    tenant?.id || '',
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    resolvedParams.serviceId,
    actualStaffId
  );

  // Hold slot functionality
  const {
    currentHold,
    holdSlot,
    releaseSlot,
    isHolding
  } = useHoldSlot();

  // Hold countdown
  const { formattedTime, isExpired } = useHoldCountdown(currentHold?.expires_at || null);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSlotSelect = async (slot: any) => {
    if (!tenant?.id || !service) return;

    // Hold the slot
    holdSlot({
      tenantId: tenant.id,
      staffId: slot.staffId,
      serviceId: service.id,
      date: slot.date,
      time: slot.time,
      durationMinutes: service.duration_minutes
    });

    // Navigate to details page with slot information
    const queryParams = new URLSearchParams({
      date: slot.date,
      time: slot.time,
      staff: slot.staffId,
      staffName: slot.staffName || ''
    });
    
    router.push(`/${resolvedParams.domain}/book/${resolvedParams.serviceId}/details?${queryParams.toString()}`);
  };

  const handleBack = () => {
    if (currentHold) {
      releaseSlot(currentHold.id);
    }
    router.back();
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7091D9] mx-auto mb-4" />
          <p className="text-gray-600">Kalender laden...</p>
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
                  Kies datum en tijd
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Stap 3 van 4 - {service?.name} 
                  {staff && ` bij ${staff.first_name} ${staff.last_name}`}
                  {isAnyStaff && ' - Eerste beschikbare medewerker'}
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#010009]" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isBefore(startOfMonth(currentMonth), startOfMonth(new Date()))}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isAvailable = monthAvailability?.[dateStr] || false;
                const isPast = isBefore(day, startOfDay(new Date()));
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateSelect(day)}
                    disabled={!isAvailable || isPast || !isCurrentMonth}
                    className={`
                      aspect-square p-2 rounded-lg text-sm transition-colors
                      ${!isCurrentMonth ? 'text-gray-300' : ''}
                      ${isToday(day) ? 'bg-[#E3ECFB] text-[#7091D9]' : ''}
                      ${isSelected ? 'bg-[#02011F] text-white' : ''}
                      ${isAvailable && !isPast && isCurrentMonth && !isSelected ? 'hover:bg-gray-100 text-[#010009]' : ''}
                      ${!isAvailable || isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                    `}
                    style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#02011F] rounded"></div>
                <span className="text-gray-600">Geselecteerd</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span className="text-gray-600">Beschikbaar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-50 rounded"></div>
                <span className="text-gray-600">Niet beschikbaar</span>
              </div>
            </div>
          </div>

          {/* Time slots */}
          <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
            <h2 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
              {selectedDate 
                ? `Beschikbare tijden op ${format(selectedDate, 'd MMMM', { locale: nl })}`
                : 'Selecteer eerst een datum'
              }
            </h2>

            {selectedDate && (
              <>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[#7091D9]" />
                  </div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={`${slot.time}-${slot.staffId}-${index}`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.available || isHolding}
                        className={`
                          w-full p-3 rounded-lg border transition-all
                          ${slot.available 
                            ? 'border-gray-200 hover:border-[#7091D9] hover:bg-gray-50' 
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className={`h-4 w-4 ${slot.available ? 'text-[#7091D9]' : 'text-gray-400'}`} />
                            <div className="text-left">
                              <p className={`font-medium text-sm ${slot.available ? 'text-[#010009]' : 'text-gray-400'}`}
                                style={{ fontFamily: 'Aeonik, Inter, sans-serif' }}>
                                {slot.time}
                              </p>
                              {slot.staffName && (
                                <p className="text-xs text-gray-600">
                                  {slot.staffName}
                                </p>
                              )}
                            </div>
                          </div>
                          {slot.available ? (
                            <CheckCircle className="h-4 w-4 text-[#ABD37A]" />
                          ) : (
                            <span className="text-xs text-gray-500">Bezet</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-3">
                      <AlertCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Geen beschikbare tijden op deze datum
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Probeer een andere datum te selecteren
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}