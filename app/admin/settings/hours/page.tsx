'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { ValidationService } from '@/lib/services/validationService';
import { BusinessHoursTimeline } from '@/components/admin/BusinessHoursTimeline';
import { 
  Clock,
  Save,
  Loader2,
  Copy,
  AlertCircle,
  Plus,
  Trash2,
  Coffee
} from 'lucide-react';

import { 
  BusinessHours, 
  BreakTime, 
  transformDbToFrontend, 
  transformFrontendToDb 
} from '@/lib/utils/business-hours';

const defaultHours = {
  open: '09:00',
  close: '18:00',
  closed: false,
  breaks: []
};

const dayNames = {
  monday: 'Maandag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag'
};

export default function BusinessHoursPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  
  const [hours, setHours] = useState<BusinessHours>({
    monday: { ...defaultHours },
    tuesday: { ...defaultHours },
    wednesday: { ...defaultHours },
    thursday: { ...defaultHours },
    friday: { ...defaultHours },
    saturday: { ...defaultHours },
    sunday: { ...defaultHours, closed: true }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenantId) {
      fetchBusinessHours();
    }
  }, [tenantId]);

  const fetchBusinessHours = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('business_hours')
        .eq('id', tenantId)
        .single();

      if (!error && data?.business_hours) {
        // Transform database format to frontend format
        const transformedHours = transformDbToFrontend(data.business_hours);
        setHours(transformedHours);
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
      setMessage({ type: 'error', text: 'Kon openingstijden niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (day: keyof BusinessHours, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    
    // Clear validation error for this day
    const errorKey = `${day}_time`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateBusinessHours = (): boolean => {
    const errors: Record<string, string> = {};
    
    (Object.keys(hours) as (keyof BusinessHours)[]).forEach(day => {
      const dayHours = hours[day];
      if (!dayHours.closed) {
        // Validate basic opening hours
        const timeValidation = ValidationService.validateTime(dayHours.open, dayHours.close);
        if (!timeValidation.isValid) {
          errors[`${day}_time`] = timeValidation.error!;
        }
        
        // Validate breaks if they exist
        if (dayHours.breaks && dayHours.breaks.length > 0) {
          // Validate each break
          dayHours.breaks.forEach((breakTime, index) => {
            const breakValidation = ValidationService.validateBreakTime(
              breakTime.start, 
              breakTime.end, 
              dayHours.open, 
              dayHours.close
            );
            if (!breakValidation.isValid) {
              errors[`${day}_break_${index}`] = breakValidation.error!;
            }
          });
          
          // Validate break overlaps
          const overlapValidation = ValidationService.validateBreakOverlaps(dayHours.breaks);
          if (!overlapValidation.isValid) {
            errors[`${day}_breaks_overlap`] = overlapValidation.error!;
          }
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addBreak = (day: keyof BusinessHours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [
          ...(prev[day].breaks || []),
          { start: '12:00', end: '13:00' }
        ]
      }
    }));
  };

  const removeBreak = (day: keyof BusinessHours, breakIndex: number) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks?.filter((_, index) => index !== breakIndex) || []
      }
    }));
  };

  const updateBreak = (day: keyof BusinessHours, breakIndex: number, field: 'start' | 'end', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks?.map((breakTime, index) => 
          index === breakIndex ? { ...breakTime, [field]: value } : breakTime
        ) || []
      }
    }));
    
    // Clear validation errors for this break
    const errorKey = `${day}_break_${breakIndex}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        delete newErrors[`${day}_breaks_overlap`];
        return newErrors;
      });
    }
  };

  const handleClosedToggle = (day: keyof BusinessHours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed
      }
    }));
  };

  const copyFromPreviousDay = (targetDay: keyof BusinessHours) => {
    const days = Object.keys(dayNames) as (keyof BusinessHours)[];
    const targetIndex = days.indexOf(targetDay);
    if (targetIndex > 0) {
      const previousDay = days[targetIndex - 1];
      setHours(prev => ({
        ...prev,
        [targetDay]: { ...prev[previousDay] }
      }));
    }
  };

  const applyPreset = (presetType: 'office' | 'retail' | 'salon') => {
    let presetHours: BusinessHours;
    
    switch (presetType) {
      case 'office':
        presetHours = {
          monday: { open: '09:00', close: '17:00', closed: false, breaks: [{ start: '12:00', end: '13:00' }] },
          tuesday: { open: '09:00', close: '17:00', closed: false, breaks: [{ start: '12:00', end: '13:00' }] },
          wednesday: { open: '09:00', close: '17:00', closed: false, breaks: [{ start: '12:00', end: '13:00' }] },
          thursday: { open: '09:00', close: '17:00', closed: false, breaks: [{ start: '12:00', end: '13:00' }] },
          friday: { open: '09:00', close: '17:00', closed: false, breaks: [{ start: '12:00', end: '13:00' }] },
          saturday: { open: '09:00', close: '17:00', closed: true, breaks: [] },
          sunday: { open: '09:00', close: '17:00', closed: true, breaks: [] }
        };
        break;
      case 'retail':
        presetHours = {
          monday: { open: '10:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          tuesday: { open: '10:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          wednesday: { open: '10:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          thursday: { open: '10:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          friday: { open: '10:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          saturday: { open: '10:00', close: '18:00', closed: false, breaks: [] },
          sunday: { open: '12:00', close: '17:00', closed: false, breaks: [] }
        };
        break;
      case 'salon':
        presetHours = {
          monday: { open: '09:00', close: '18:00', closed: true, breaks: [] },
          tuesday: { open: '09:00', close: '18:00', closed: false, breaks: [{ start: '12:30', end: '13:30' }] },
          wednesday: { open: '09:00', close: '18:00', closed: false, breaks: [{ start: '12:30', end: '13:30' }] },
          thursday: { open: '09:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          friday: { open: '09:00', close: '20:00', closed: false, breaks: [{ start: '14:00', end: '15:00' }] },
          saturday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
          sunday: { open: '09:00', close: '18:00', closed: true, breaks: [] }
        };
        break;
    }
    
    setHours(presetHours);
    setValidationErrors({});
    setMessage({ type: 'success', text: 'Preset toegepast! Vergeet niet op te slaan.' });
  };

  const handleSave = async () => {
    if (!tenantId) return;
    
    // Validate business hours before saving
    if (!validateBusinessHours()) {
      setMessage({ type: 'error', text: 'Controleer de openingstijden en probeer opnieuw' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Transform frontend format back to database format
      const dbHours = transformFrontendToDb(hours);
      
      const { error } = await supabase
        .from('tenants')
        .update({
          business_hours: dbHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Openingstijden succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving business hours:', error);
      setMessage({ type: 'error', text: 'Kon openingstijden niet opslaan' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-p max-w-4xl space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Openingstijden</h1>
        <p className="text-gray-600 mt-2">
          Stel de openingstijden van uw salon in
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="text-heading">Weekschema</h2>
          </div>
          
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 self-center">Snelle presets:</span>
            <button
              onClick={() => applyPreset('office')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Kantoor (Ma-Vr 9-17)
            </button>
            <button
              onClick={() => applyPreset('retail')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Winkel (Ma-Za 10-20)
            </button>
            <button
              onClick={() => applyPreset('salon')}
              className="px-3 py-1.5 text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors"
            >
              Salon (Di-Za)
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {(Object.keys(dayNames) as (keyof BusinessHours)[]).map((day, index) => {
            const errorKey = `${day}_time`;
            const hasError = validationErrors[errorKey];
            const inputClassName = hasError 
              ? "px-3 py-2 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              : "px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500";
              
            return (
              <div key={day} className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center py-3 border-b last:border-0">
                  <div className="font-medium">{dayNames[day]}</div>
                  
                  <div className="md:col-span-2">
                    {!hours[day].closed ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hours[day].open}
                          onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                          className={inputClassName}
                        />
                        <span className="text-gray-500">tot</span>
                        <input
                          type="time"
                          value={hours[day].close}
                          onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-500">Gesloten</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours[day].closed}
                    onChange={() => handleClosedToggle(day)}
                  />
                  <span className="text-sm">Gesloten</span>
                </label>
                
                {index > 0 && (
                  <button
                    onClick={() => copyFromPreviousDay(day)}
                    className="ml-auto p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Kopieer van vorige dag"
                  >
                    <Copy className="h-4 w-4" />
                    </button>
                  )}
                  </div>
                </div>
                
                {/* Break Times */}
                {!hours[day].closed && (
                  <div className="ml-0 md:ml-32 space-y-2">
                    {hours[day].breaks && hours[day].breaks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Coffee className="h-4 w-4" />
                          <span>Pauzes</span>
                        </div>
                        {hours[day].breaks.map((breakTime, breakIndex) => {
                          const breakErrorKey = `${day}_break_${breakIndex}`;
                          const hasBreakError = validationErrors[breakErrorKey];
                          const breakInputClassName = hasBreakError 
                            ? "px-2 py-1 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                            : "px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500";
                          
                          return (
                            <div key={breakIndex} className="flex items-center gap-2 ml-6">
                              <input
                                type="time"
                                value={breakTime.start}
                                onChange={(e) => updateBreak(day, breakIndex, 'start', e.target.value)}
                                className={breakInputClassName}
                              />
                              <span className="text-gray-500 text-sm">tot</span>
                              <input
                                type="time"
                                value={breakTime.end}
                                onChange={(e) => updateBreak(day, breakIndex, 'end', e.target.value)}
                                className={breakInputClassName}
                              />
                              <button
                                onClick={() => removeBreak(day, breakIndex)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Verwijder pauze"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              {hasBreakError && (
                                <p className="text-red-500 text-xs">{validationErrors[breakErrorKey]}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <button
                      onClick={() => addBreak(day)}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors ml-6"
                    >
                      <Plus className="h-3 w-3" />
                      Pauze toevoegen
                    </button>
                    
                    {/* Break overlap error */}
                    {validationErrors[`${day}_breaks_overlap`] && (
                      <p className="text-red-500 text-xs ml-6">{validationErrors[`${day}_breaks_overlap`]}</p>
                    )}
                  </div>
                )}
                
                {hasError && (
                  <p className="text-red-500 text-xs ml-0 md:ml-32">{validationErrors[errorKey]}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Special Hours Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Feestdagen en speciale openingstijden</p>
              <p>Voor afwijkende openingstijden op feestdagen kunt u gebruik maken van de agenda om specifieke dagen te blokkeren.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <BusinessHoursTimeline hours={hours} />

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Wijzigingen Opslaan
            </>
          )}
        </button>
      </div>
    </div>
  );
}