'use client';

import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useBusinessHours } from '@/lib/hooks/useBusinessHours';
import { supabase } from '@/lib/supabase';
import { 
  Clock,
  Save,
  Loader2,
  Copy,
  AlertCircle
} from 'lucide-react';

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

const defaultHours = {
  open: '09:00',
  close: '18:00',
  closed: false
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

export function OpeningHoursTab() {
  const { isAdmin } = useIsAdmin();
  const { tenantId } = useTenant();
  const { invalidateBusinessHours } = useBusinessHours();
  
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
        setHours(data.business_hours);
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

  const handleSave = async () => {
    if (!tenantId || !isAdmin) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          business_hours: hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      // Invalidate cached business hours to trigger re-fetch across all components
      invalidateBusinessHours();
      
      setMessage({ type: 'success', text: 'Openingstijden succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving business hours:', error);
      setMessage({ type: 'error', text: 'Kon openingstijden niet opslaan' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Openingstijden</h2>
        <p className="text-gray-600 mt-1">
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

      {!isAdmin && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Alleen-lezen:</strong> U heeft geen beheerrechten om deze gegevens te wijzigen.
          </p>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-medium">Weekschema</h3>
        </div>

        <div className="space-y-4">
          {(Object.keys(dayNames) as (keyof BusinessHours)[]).map((day, index) => (
            <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center py-3 border-b last:border-0">
              <div className="font-medium">{dayNames[day]}</div>
              
              <div className="md:col-span-2">
                {!hours[day].closed ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours[day].open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      disabled={!isAdmin}
                      className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <span className="text-gray-500">tot</span>
                    <input
                      type="time"
                      value={hours[day].close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      disabled={!isAdmin}
                      className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                    disabled={!isAdmin}
                    className="disabled:opacity-50"
                  />
                  <span className="text-sm">Gesloten</span>
                </label>
                
                {index > 0 && isAdmin && (
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
          ))}
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

      {/* Save Button */}
      {isAdmin && (
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
      )}
    </div>
  );
}