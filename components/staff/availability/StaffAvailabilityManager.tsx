'use client';

import { useState } from 'react';
import { useStaffAuth } from '@/lib/hooks/useStaffAuth';
import { useStaffAvailability } from '@/lib/hooks/useStaffAvailability';
import { WeekSchedule, DEFAULT_WORKING_HOURS, DAY_NAMES_WEEK } from '@/types/availability';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Save, 
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export function StaffAvailabilityManager() {
  const { user, hasPermission } = useStaffAuth();
  const {
    weekSchedule,
    loading,
    updateSchedule,
    updateScheduleLoading,
    updateScheduleError
  } = useStaffAvailability();

  const [editingSchedule, setEditingSchedule] = useState<WeekSchedule | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const canManageSchedule = hasPermission('can_manage_own_schedule');

  if (!canManageSchedule) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="h-5 w-5" />
          <p>U heeft geen toestemming om uw werkschema te beheren.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mobile-p space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Use weekSchedule if available, otherwise use defaults
  const currentSchedule = editingSchedule || weekSchedule || DEFAULT_WORKING_HOURS;

  const handleDayToggle = (day: keyof WeekSchedule) => {
    const baseSchedule = editingSchedule || weekSchedule || DEFAULT_WORKING_HOURS;
    
    const newSchedule = {
      ...baseSchedule,
      [day]: {
        ...baseSchedule[day],
        enabled: !baseSchedule[day].enabled
      }
    };
    
    setEditingSchedule(newSchedule);
    setHasChanges(true);
  };

  const handleTimeChange = (day: keyof WeekSchedule, field: 'start' | 'end', value: string) => {
    const baseSchedule = editingSchedule || weekSchedule || DEFAULT_WORKING_HOURS;

    const newSchedule = {
      ...baseSchedule,
      [day]: {
        ...baseSchedule[day],
        [field]: value
      }
    };
    
    setEditingSchedule(newSchedule);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (editingSchedule) {
      updateSchedule(editingSchedule);
      setEditingSchedule(null);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setEditingSchedule(null);
    setHasChanges(false);
  };

  const handleReset = () => {
    setEditingSchedule(DEFAULT_WORKING_HOURS);
    setHasChanges(true);
  };

  const dayOrder: (keyof WeekSchedule)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  return (
    <div className="mobile-p space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Werkschema Beheer</h2>
          <p className="text-gray-600 mt-1">
            Beheer uw werkuren en beschikbaarheid
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="btn-secondary"
              disabled={updateScheduleLoading}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={updateScheduleLoading}
              className="btn-primary"
            >
              {updateScheduleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Opslaan
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {updateScheduleError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Fout bij opslaan</p>
          </div>
          <p className="text-red-600 text-sm mt-1">
            {updateScheduleError.message || 'Er is een onbekende fout opgetreden'}
          </p>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Wekelijks Schema</h3>
          </div>
          
          <button
            onClick={handleReset}
            className="btn-secondary btn-sm"
            disabled={updateScheduleLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Standaard instellen
          </button>
        </div>

        <div className="space-y-4">
          {dayOrder.map((day) => {
            const daySchedule = currentSchedule[day];
            
            return (
              <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 w-32">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled}
                    onChange={() => handleDayToggle(day)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="font-medium text-gray-900">
                    {DAY_NAMES_WEEK[day]}
                  </label>
                </div>

                {daySchedule.enabled ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Van:</label>
                      <input
                        type="time"
                        value={daySchedule.start}
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Tot:</label>
                      <input
                        type="time"
                        value={daySchedule.end}
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="text-sm text-gray-500 ml-auto">
                      {(() => {
                        const start = daySchedule.start.split(':').map(Number);
                        const end = daySchedule.end.split(':').map(Number);
                        const startMinutes = start[0] * 60 + start[1];
                        const endMinutes = end[0] * 60 + end[1];
                        const totalMinutes = endMinutes - startMinutes;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        return `${hours}u ${minutes > 0 ? `${minutes}m` : ''}`;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-gray-500 italic">
                    Niet beschikbaar
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h4 className="font-semibold">Uitzonderingen</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Beheer vakantiedagen, vrije dagen en aangepaste werkuren
          </p>
          <button className="btn-secondary btn-sm w-full">
            <Plus className="h-4 w-4 mr-2" />
            Uitzondering toevoegen
          </button>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Schema Status</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Werkdagen per week:</span>
              <span className="font-medium">
                {dayOrder.filter(day => currentSchedule[day].enabled).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Totale werkuren:</span>
              <span className="font-medium">
                {(() => {
                  const totalMinutes = dayOrder.reduce((total, day) => {
                    if (!currentSchedule[day].enabled) return total;
                    const start = currentSchedule[day].start.split(':').map(Number);
                    const end = currentSchedule[day].end.split(':').map(Number);
                    const startMinutes = start[0] * 60 + start[1];
                    const endMinutes = end[0] * 60 + end[1];
                    return total + (endMinutes - startMinutes);
                  }, 0);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return `${hours}u ${minutes > 0 ? `${minutes}m` : ''}`;
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}