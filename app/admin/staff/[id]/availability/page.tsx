'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { useStaffSchedule } from '@/lib/hooks/useStaffSchedules';
import { AvailabilityService } from '@/lib/services/availabilityService';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  Clock,
  Calendar,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { WeekSchedule, DEFAULT_WORKING_HOURS } from '@/types/availability';

// Proper day names mapping for WeekSchedule keys
const DAY_NAMES: Record<keyof WeekSchedule, string> = {
  monday: 'Maandag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag'
};

interface StaffMember {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'staff';
  active: boolean;
  created_at: string;
}

export default function StaffAvailabilityPage() {
  const { isAdmin, isLoading: adminLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeekSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get staff schedule
  const { data: weekSchedule, refetch } = useStaffSchedule(staffId, tenantId || '');

  useEffect(() => {
    if (tenantId && staffId) {
      fetchStaffMember();
    }
  }, [tenantId, staffId]);

  const fetchStaffMember = async () => {
    if (!tenantId || !staffId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', staffId)
        .eq('tenant_id', tenantId)
        .single();

      if (!error && data) {
        setStaffMember(data);
      } else {
        setMessage({ type: 'error', text: 'Medewerker niet gevonden' });
      }
    } catch (error) {
      console.error('Error fetching staff member:', error);
      setMessage({ type: 'error', text: 'Fout bij ophalen medewerker gegevens' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel editing
      setEditingSchedule(null);
      setEditMode(false);
    } else {
      // Start editing
      setEditingSchedule(weekSchedule || DEFAULT_WORKING_HOURS);
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    if (!editingSchedule || !tenantId) return;

    setSaving(true);
    try {
      await AvailabilityService.updateStaffSchedule(staffId, tenantId, editingSchedule);
      await refetch();
      setEditMode(false);
      setEditingSchedule(null);
      setMessage({ type: 'success', text: 'Schema succesvol opgeslagen' });
    } catch (error) {
      console.error('Error saving schedule:', error);
      setMessage({ type: 'error', text: 'Fout bij opslaan van schema' });
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (day: keyof WeekSchedule, field: 'start' | 'end', value: string) => {
    if (!editingSchedule) return;
    
    setEditingSchedule({
      ...editingSchedule,
      [day]: {
        ...editingSchedule[day],
        [field]: value
      }
    });
  };

  const handleDayToggle = (day: keyof WeekSchedule, enabled: boolean) => {
    if (!editingSchedule) return;

    setEditingSchedule({
      ...editingSchedule,
      [day]: {
        ...editingSchedule[day],
        enabled
      }
    });
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="mobile-p space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/staff')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Medewerker niet gevonden</h1>
          </div>
        </div>
      </div>
    );
  }

  const displaySchedule = editingSchedule || weekSchedule || DEFAULT_WORKING_HOURS;

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/staff')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Schema Beheer</h1>
          <p className="text-gray-600 mt-2">
            Beheer het werkschema van {staffMember.name}
          </p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleEditToggle}
                className="btn-secondary"
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Annuleren
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Opslaan
              </button>
            </>
          ) : (
            <button
              onClick={handleEditToggle}
              className="btn-primary"
            >
              <Edit className="h-4 w-4" />
              Schema Bewerken
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Staff Info */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-lg font-medium text-gray-600">
              {staffMember.name ? staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{staffMember.name}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {staffMember.email}
              </div>
              {staffMember.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {staffMember.phone}
                </div>
              )}
              <span className={`status-chip ${
                staffMember.role === 'admin' 
                  ? 'bg-icon-purple-bg text-icon-purple' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {staffMember.role === 'admin' ? 'Admin' : 'Medewerker'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Wekelijks Schema</h3>
          {!editMode && !weekSchedule && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Geen schema ingesteld
            </span>
          )}
        </div>

        <div className="space-y-4">
          {(Object.keys(DAY_NAMES) as Array<keyof WeekSchedule>).map((day) => {
            const dayName = DAY_NAMES[day];
            const daySchedule = displaySchedule[day] || DEFAULT_WORKING_HOURS[day];
            
            // Safety check to ensure daySchedule exists
            if (!daySchedule) {
              console.error(`Missing daySchedule for ${day}`, { displaySchedule, day });
              return null;
            }
            
            return (
              <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-20">
                  <span className="font-medium">{dayName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled}
                    onChange={(e) => editMode && handleDayToggle(day, e.target.checked)}
                    disabled={!editMode}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">Werkdag</span>
                </div>

                {daySchedule.enabled && (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <input
                        type="time"
                        value={daySchedule.start}
                        onChange={(e) => editMode && handleTimeChange(day, 'start', e.target.value)}
                        disabled={!editMode}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                      <span className="text-gray-500">tot</span>
                      <input
                        type="time"
                        value={daySchedule.end}
                        onChange={(e) => editMode && handleTimeChange(day, 'end', e.target.value)}
                        disabled={!editMode}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const startMinutes = parseInt(daySchedule.start.split(':')[0]) * 60 + parseInt(daySchedule.start.split(':')[1]);
                        const endMinutes = parseInt(daySchedule.end.split(':')[0]) * 60 + parseInt(daySchedule.end.split(':')[1]);
                        const hours = (endMinutes - startMinutes) / 60;
                        return `${hours.toFixed(1)}u`;
                      })()}
                    </div>
                  </div>
                )}

                {!daySchedule.enabled && (
                  <div className="flex-1 text-sm text-gray-500">
                    Niet beschikbaar
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Schedule Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Schema Overzicht</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Werkdagen:</span>
              <div className="font-medium">
                {Object.entries(displaySchedule)
                  .filter(([_, schedule]) => schedule.enabled)
                  .length} dagen per week
              </div>
            </div>
            <div>
              <span className="text-gray-600">Totaal uren:</span>
              <div className="font-medium">
                {Object.entries(displaySchedule)
                  .filter(([_, schedule]) => schedule.enabled)
                  .reduce((total, [_, schedule]) => {
                    const startMinutes = parseInt(schedule.start.split(':')[0]) * 60 + parseInt(schedule.start.split(':')[1]);
                    const endMinutes = parseInt(schedule.end.split(':')[0]) * 60 + parseInt(schedule.end.split(':')[1]);
                    return total + (endMinutes - startMinutes) / 60;
                  }, 0)
                  .toFixed(1)}u per week
              </div>
            </div>
            <div>
              <span className="text-gray-600">Vroegste start:</span>
              <div className="font-medium">
                {Object.entries(displaySchedule)
                  .filter(([_, schedule]) => schedule.enabled)
                  .map(([_, schedule]) => schedule.start)
                  .sort()[0] || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Laatste einde:</span>
              <div className="font-medium">
                {Object.entries(displaySchedule)
                  .filter(([_, schedule]) => schedule.enabled)
                  .map(([_, schedule]) => schedule.end)
                  .sort()
                  .reverse()[0] || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future: Exceptions section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Uitzonderingen</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Binnenkort beschikbaar
          </span>
        </div>
        <p className="text-gray-600 text-sm">
          Hier komt functionaliteit voor het beheren van vakantie, ziekmelding en andere uitzonderingen op het reguliere schema.
        </p>
      </div>
    </div>
  );
}