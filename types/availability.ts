// Staff availability and schedule types

export interface WorkingHours {
  [day: string]: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}


export interface ScheduleException {
  id: string;
  tenant_id: string;
  staff_id: string;
  date: string;        // YYYY-MM-DD format
  start_time?: string; // HH:mm:ss format (null for full day off)
  end_time?: string;   // HH:mm:ss format (null for full day off)
  is_available: boolean; // false = day off, true = working but different hours
  reason?: string;     // vacation, sick, personal, etc.
  created_at?: string;
}

// For easier handling in UI components
export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // HH:mm format
  end: string;   // HH:mm format
  breaks?: TimeSlot[]; // Future feature for breaks
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  type?: 'break' | 'lunch' | 'unavailable';
}

// Exception types for better UX
export type ExceptionType = 'vacation' | 'sick' | 'personal' | 'training' | 'other';

export const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  vacation: 'Vakantie',
  sick: 'Ziekmelding',
  personal: 'Persoonlijk',
  training: 'Training',
  other: 'Anders'
};

export const EXCEPTION_COLORS: Record<ExceptionType, { bg: string; text: string }> = {
  vacation: { bg: 'bg-blue-100', text: 'text-blue-800' },
  sick: { bg: 'bg-red-100', text: 'text-red-800' },
  personal: { bg: 'bg-purple-100', text: 'text-purple-800' },
  training: { bg: 'bg-green-100', text: 'text-green-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' }
};

// Day names in Dutch (for UI)
export const DAY_NAMES: Record<number, string> = {
  0: 'Zondag',
  1: 'Maandag', 
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag'
};

// Day names for WeekSchedule keys
export const DAY_NAMES_WEEK: Record<keyof WeekSchedule, string> = {
  monday: 'Maandag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag'
};

export const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'Zo',
  1: 'Ma',
  2: 'Di', 
  3: 'Wo',
  4: 'Do',
  5: 'Vr',
  6: 'Za'
};

// Utility functions
export function formatTime(time: string): string {
  // Convert HH:mm:ss to HH:mm
  return time.substring(0, 5);
}

export function parseTime(time: string): string {
  // Ensure HH:mm:ss format from HH:mm
  return time.includes(':') && time.length === 5 ? `${time}:00` : time;
}

export function isValidTimeRange(start: string, end: string): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return endMinutes > startMinutes;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Default working hours (9 AM to 5 PM, Monday to Saturday)
export const DEFAULT_WORKING_HOURS: WeekSchedule = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: true, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' }
};