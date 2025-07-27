'use client';

import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useBookingRules } from '@/lib/hooks/useBookingRules';
import { supabase } from '@/lib/supabase';
import { 
  Calendar,
  Clock,
  Users,
  Globe,
  Save,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';

interface BookingRules {
  advance_booking: {
    min_hours: number;
    max_days: number;
  };
  cancellation: {
    allowed_hours_before: number;
    charge_fee: boolean;
    fee_percentage: number;
  };
  buffer_time: {
    before_minutes: number;
    after_minutes: number;
  };
  online_booking: {
    enabled: boolean;
    require_approval: boolean;
    allow_same_day: boolean;
  };
  capacity: {
    max_concurrent_bookings: number;
    overbooking_allowed: boolean;
    overbooking_percentage: number;
  };
  restrictions: {
    max_bookings_per_client_per_day: number;
    max_bookings_per_client_per_week: number;
    require_phone_number: boolean;
    require_email: boolean;
  };
}

const defaultRules: BookingRules = {
  advance_booking: {
    min_hours: 2,
    max_days: 30
  },
  cancellation: {
    allowed_hours_before: 24,
    charge_fee: false,
    fee_percentage: 50
  },
  buffer_time: {
    before_minutes: 15,
    after_minutes: 15
  },
  online_booking: {
    enabled: true,
    require_approval: false,
    allow_same_day: true
  },
  capacity: {
    max_concurrent_bookings: 10,
    overbooking_allowed: false,
    overbooking_percentage: 10
  },
  restrictions: {
    max_bookings_per_client_per_day: 3,
    max_bookings_per_client_per_week: 7,
    require_phone_number: true,
    require_email: true
  }
};

export function BookingRulesTab() {
  const { isAdmin } = useIsAdmin();
  const { tenantId } = useTenant();
  const { invalidateBookingRules } = useBookingRules();
  
  const [rules, setRules] = useState<BookingRules>(defaultRules);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchBookingRules();
    }
  }, [tenantId]);

  const fetchBookingRules = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('booking_settings')
        .eq('id', tenantId)
        .single();

      if (!error && data?.booking_settings) {
        setRules({
          ...defaultRules,
          ...data.booking_settings
        });
      }
    } catch (error) {
      console.error('Error fetching booking rules:', error);
      setMessage({ type: 'error', text: 'Kon boekingsregels niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (category: keyof BookingRules, setting: string, value: number) => {
    setRules(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleToggle = (category: keyof BookingRules, setting: string, value: boolean) => {
    setRules(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!tenantId || !isAdmin) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          booking_settings: rules,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      // Invalidate cached booking rules to trigger re-fetch across all components
      invalidateBookingRules();
      
      setMessage({ type: 'success', text: 'Boekingsregels succesvol bijgewerkt' });
    } catch (error) {
      console.error('Error saving booking rules:', error);
      setMessage({ type: 'error', text: 'Kon boekingsregels niet opslaan' });
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
        <h2 className="text-xl font-semibold">Boekingsregels</h2>
        <p className="text-gray-600 mt-1">
          Stel regels in voor online en offline boekingen
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

      {/* Advance Booking */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-medium">Vooruit Boeken</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum tijd vooruit (uren)
            </label>
            <input
              type="number"
              value={rules.advance_booking.min_hours}
              onChange={(e) => handleNumberChange('advance_booking', 'min_hours', parseInt(e.target.value) || 0)}
              disabled={!isAdmin}
              min="0"
              max="168"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Klanten kunnen minimaal dit aantal uren vooruit boeken</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum dagen vooruit
            </label>
            <input
              type="number"
              value={rules.advance_booking.max_days}
              onChange={(e) => handleNumberChange('advance_booking', 'max_days', parseInt(e.target.value) || 0)}
              disabled={!isAdmin}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximaal aantal dagen dat vooruit geboekt kan worden</p>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-medium">Annuleringsbeleid</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gratis annuleren tot (uren vooraf)
            </label>
            <input
              type="number"
              value={rules.cancellation.allowed_hours_before}
              onChange={(e) => handleNumberChange('cancellation', 'allowed_hours_before', parseInt(e.target.value) || 0)}
              disabled={!isAdmin}
              min="0"
              max="168"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Klanten kunnen gratis annuleren tot dit aantal uren vooraf</p>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Annuleringskosten berekenen</label>
              <p className="text-sm text-gray-500">Bereken kosten bij late annulering</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rules.cancellation.charge_fee}
                onChange={(e) => handleToggle('cancellation', 'charge_fee', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          {rules.cancellation.charge_fee && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annuleringskosten (% van behandelprijs)
              </label>
              <input
                type="number"
                value={rules.cancellation.fee_percentage}
                onChange={(e) => handleNumberChange('cancellation', 'fee_percentage', parseInt(e.target.value) || 0)}
                disabled={!isAdmin}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage van de behandelprijs dat in rekening wordt gebracht</p>
            </div>
          )}
        </div>
      </div>

      {/* Buffer Time */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-medium">Buffer Tijd</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voor afspraak (minuten)
            </label>
            <input
              type="number"
              value={rules.buffer_time.before_minutes}
              onChange={(e) => handleNumberChange('buffer_time', 'before_minutes', parseInt(e.target.value) || 0)}
              disabled={!isAdmin}
              min="0"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tijd voor elke afspraak voor voorbereiding</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Na afspraak (minuten)
            </label>
            <input
              type="number"
              value={rules.buffer_time.after_minutes}
              onChange={(e) => handleNumberChange('buffer_time', 'after_minutes', parseInt(e.target.value) || 0)}
              disabled={!isAdmin}
              min="0"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tijd na elke afspraak voor opruimen</p>
          </div>
        </div>
      </div>

      {/* Online Booking */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-medium">Online Boeken</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Online boeken inschakelen</label>
              <p className="text-sm text-gray-500">Sta klanten toe om online af te spreken</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rules.online_booking.enabled}
                onChange={(e) => handleToggle('online_booking', 'enabled', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className={`space-y-4 ${!rules.online_booking.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <div>
                <label className="font-medium">Goedkeuring vereist</label>
                <p className="text-sm text-gray-500">Online boekingen moeten eerst goedgekeurd worden</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.online_booking.require_approval}
                  onChange={(e) => handleToggle('online_booking', 'require_approval', e.target.checked)}
                  disabled={!isAdmin || !rules.online_booking.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <div>
                <label className="font-medium">Zelfde dag boeken toestaan</label>
                <p className="text-sm text-gray-500">Klanten mogen voor dezelfde dag boeken</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.online_booking.allow_same_day}
                  onChange={(e) => handleToggle('online_booking', 'allow_same_day', e.target.checked)}
                  disabled={!isAdmin || !rules.online_booking.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Management */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Capaciteit Beheer</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum gelijktijdige boekingen
            </label>
            <input
              type="number"
              value={rules.capacity.max_concurrent_bookings}
              onChange={(e) => handleNumberChange('capacity', 'max_concurrent_bookings', parseInt(e.target.value) || 1)}
              disabled={!isAdmin}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum aantal afspraken op hetzelfde tijdstip</p>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Overboeken toestaan</label>
              <p className="text-sm text-gray-500">Sta meer boekingen toe dan de normale capaciteit</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rules.capacity.overbooking_allowed}
                onChange={(e) => handleToggle('capacity', 'overbooking_allowed', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          {rules.capacity.overbooking_allowed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overboeken percentage (%)
              </label>
              <input
                type="number"
                value={rules.capacity.overbooking_percentage}
                onChange={(e) => handleNumberChange('capacity', 'overbooking_percentage', parseInt(e.target.value) || 0)}
                disabled={!isAdmin}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage extra boekingen boven normale capaciteit</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Restrictions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Klant Beperkingen</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max boekingen per dag per klant
              </label>
              <input
                type="number"
                value={rules.restrictions.max_bookings_per_client_per_day}
                onChange={(e) => handleNumberChange('restrictions', 'max_bookings_per_client_per_day', parseInt(e.target.value) || 1)}
                disabled={!isAdmin}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max boekingen per week per klant
              </label>
              <input
                type="number"
                value={rules.restrictions.max_bookings_per_client_per_week}
                onChange={(e) => handleNumberChange('restrictions', 'max_bookings_per_client_per_week', parseInt(e.target.value) || 1)}
                disabled={!isAdmin}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">Telefoonnummer verplicht</label>
              <p className="text-sm text-gray-500">Klanten moeten een telefoonnummer opgeven</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rules.restrictions.require_phone_number}
                onChange={(e) => handleToggle('restrictions', 'require_phone_number', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <label className="font-medium">E-mailadres verplicht</label>
              <p className="text-sm text-gray-500">Klanten moeten een e-mailadres opgeven</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rules.restrictions.require_email}
                onChange={(e) => handleToggle('restrictions', 'require_email', e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Boekingsregels Informatie</p>
            <p>Deze instellingen worden toegepast op alle nieuwe boekingen. Bestaande afspraken blijven ongewijzigd tenzij u deze handmatig aanpast.</p>
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