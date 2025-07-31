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
  Timer,
  X,
  Info
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
  startOfDay,
  getDay,
  endOfDay
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
  const { data: monthAvailability, isLoading: availabilityLoading, error: availabilityError } = useStaffAvailability(
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
                <h1 className="text-2xl font-medium text-[#010009]" style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}>
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
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#010009]" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
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

            {/* Availability status info */}
            {availabilityError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">
                    Kon beschikbaarheid niet laden. Probeer het opnieuw.
                  </p>
                </div>
              </div>
            )}
            
            {monthAvailability && Object.values(monthAvailability).every(available => !available) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">
                      Geen beschikbare dagen deze maand
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {isAnyStaff ? 'Geen medewerkers beschikbaar' : `${staff?.first_name} ${staff?.last_name} werkt niet deze maand`}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!isAnyStaff && staff && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Beschikbaarheid van <span className="font-medium">{staff.first_name} {staff.last_name}</span>
                  </p>
                </div>
              </div>
            )}
            
            {isAnyStaff && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Beschikbaarheid gebaseerd op alle medewerkers
                  </p>
                </div>
              </div>
            )}

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1.5 sm:py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {availabilityLoading ? (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg min-h-[44px]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isAvailable = monthAvailability?.[dateStr] || false;
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                  const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, etc.
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  // Determine availability reason for tooltip
                  let availabilityReason = '';
                  if (isPast) {
                    availabilityReason = 'Verleden datum';
                  } else if (!isCurrentMonth) {
                    availabilityReason = 'Buiten huidige maand';
                  } else if (!isAvailable && isWeekend) {
                    availabilityReason = 'Weekend - salon gesloten';
                  } else if (!isAvailable && !isAnyStaff) {
                    availabilityReason = `${staff?.first_name} werkt niet op deze dag`;
                  } else if (!isAvailable) {
                    availabilityReason = 'Geen medewerkers beschikbaar';
                  }
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDateSelect(day)}
                      disabled={!isAvailable || isPast || !isCurrentMonth}
                      title={availabilityReason || ''}
                      className={`
                        aspect-square p-1 sm:p-2 rounded-lg text-xs sm:text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center relative group
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isToday(day) && isAvailable ? 'bg-[#E3ECFB] text-[#7091D9] ring-2 ring-[#7091D9] ring-opacity-30' : ''}
                        ${isSelected ? 'bg-[#02011F] text-white shadow-lg' : ''}
                        ${isAvailable && !isPast && isCurrentMonth && !isSelected && !isToday(day) ? 'hover:bg-gray-100 text-[#010009] active:bg-gray-200 border border-transparent hover:border-gray-300' : ''}
                        ${!isAvailable && !isPast && isCurrentMonth ? (
                          isWeekend 
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed relative' 
                            : 'bg-red-50 text-red-400 cursor-not-allowed relative'
                        ) : ''}
                        ${isPast ? 'text-gray-300 cursor-not-allowed bg-gray-50' : ''}
                      `}
                      style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                    >
                      <span className="relative z-10">{format(day, 'd')}</span>
                      {!isAvailable && !isPast && isCurrentMonth && (
                        <X className="absolute inset-0 m-auto h-3 w-3 text-gray-400 opacity-60" />
                      )}
                      
                      {/* Tooltip on hover */}
                      {availabilityReason && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          {availabilityReason}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Enhanced Legend */}
            <div className="mt-3 sm:mt-4 space-y-2">
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 bg-[#02011F] rounded shadow-sm"></div>
                  <span className="text-gray-600">Geselecteerde datum</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                  <span className="text-gray-600">Beschikbaar</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 bg-red-50 rounded relative flex items-center justify-center">
                    <X className="h-2 w-2 text-red-400" />
                  </div>
                  <span className="text-gray-600">Geen medewerkers beschikbaar</span>
                </div>
                {!isAnyStaff && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-3 h-3 bg-gray-50 rounded relative flex items-center justify-center">
                      <X className="h-2 w-2 text-gray-400" />
                    </div>
                    <span className="text-gray-600">Medewerker werkt niet</span>
                  </div>
                )}
              </div>
              
              {monthAvailability && Object.keys(monthAvailability).length > 0 && (
                <div className="text-xs text-gray-500">
                  <span>💡 Tip: Beweeg je muis over een datum voor meer informatie</span>
                </div>
              )}
            </div>
          </div>

          {/* Time slots */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6" style={{ boxShadow: '1px 4px 8px rgba(0, 0, 0, 0.04)' }}>
            <h2 className="text-lg font-medium text-[#010009] mb-4" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
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
                  <div className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={`${slot.time}-${slot.staffId}-${index}`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.available || isHolding}
                        className={`
                          w-full p-3 sm:p-4 rounded-lg border transition-all min-h-[44px]
                          ${slot.available 
                            ? 'border-gray-200 hover:border-[#7091D9] hover:bg-gray-50 active:bg-gray-100' 
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className={`h-4 w-4 ${slot.available ? 'text-[#7091D9]' : 'text-gray-400'}`} />
                            <div className="text-left">
                              <p className={`font-medium text-sm ${slot.available ? 'text-[#010009]' : 'text-gray-400'}`}
                                style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
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