// Business hours transformation utilities
// Handles conversion between database format (numeric keys 0-6) and frontend format (named keys)

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
  breaks?: BreakTime[];
}

export interface BreakTime {
  start: string;
  end: string;
}

// Mapping between day names and database indices (0=Sunday, 1=Monday, etc.)
export const dayToIndex = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
} as const;

export const indexToDay = {
  0: 'sunday' as keyof BusinessHours,
  1: 'monday' as keyof BusinessHours,
  2: 'tuesday' as keyof BusinessHours,
  3: 'wednesday' as keyof BusinessHours,
  4: 'thursday' as keyof BusinessHours,
  5: 'friday' as keyof BusinessHours,
  6: 'saturday' as keyof BusinessHours
} as const;

const defaultDayHours: DayHours = {
  open: '09:00',
  close: '18:00',
  closed: false,
  breaks: []
};

/**
 * Transform database format (numeric keys 0-6) to frontend format (named keys)
 */
export const transformDbToFrontend = (dbHours: any): BusinessHours => {
  const result: BusinessHours = {
    monday: { ...defaultDayHours },
    tuesday: { ...defaultDayHours },
    wednesday: { ...defaultDayHours },
    thursday: { ...defaultDayHours },
    friday: { ...defaultDayHours },
    saturday: { ...defaultDayHours },
    sunday: { ...defaultDayHours, closed: true }
  };

  if (!dbHours || typeof dbHours !== 'object') {
    return result;
  }

  // Convert numeric keys to named keys
  for (const [indexStr, dayData] of Object.entries(dbHours)) {
    const index = parseInt(indexStr);
    const dayName = indexToDay[index as keyof typeof indexToDay];
    
    if (dayName && typeof dayData === 'object' && dayData !== null) {
      result[dayName] = {
        open: (dayData as any).open || defaultDayHours.open,
        close: (dayData as any).close || defaultDayHours.close,
        closed: Boolean((dayData as any).closed),
        breaks: (dayData as any).breaks || []
      };
    }
  }

  return result;
};

/**
 * Transform frontend format (named keys) to database format (numeric keys)
 */
export const transformFrontendToDb = (frontendHours: BusinessHours): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const [dayName, dayData] of Object.entries(frontendHours)) {
    const index = dayToIndex[dayName as keyof typeof dayToIndex];
    if (index !== undefined) {
      result[index.toString()] = {
        open: dayData.open,
        close: dayData.close,
        closed: dayData.closed,
        breaks: dayData.breaks || []
      };
    }
  }

  return result;
};

/**
 * Check if a specific time on a day is within business hours
 * @param businessHours - Business hours in frontend format
 * @param dayOfWeek - 0=Sunday, 1=Monday, etc.
 * @param time - Time in HH:mm format
 */
export const isTimeWithinBusinessHours = (
  businessHours: BusinessHours, 
  dayOfWeek: number, 
  time: string
): boolean => {
  const dayName = indexToDay[dayOfWeek as keyof typeof indexToDay];
  if (!dayName) return false;

  const dayHours = businessHours[dayName];
  if (dayHours.closed) return false;

  const timeMinutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(dayHours.open);
  const closeMinutes = timeToMinutes(dayHours.close);

  return timeMinutes >= openMinutes && timeMinutes < closeMinutes;
};

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string (HH:mm)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Get the earliest opening time across all days
 */
export const getEarliestOpenTime = (businessHours: BusinessHours): string => {
  let earliest = '23:59';
  
  Object.values(businessHours).forEach(dayHours => {
    if (!dayHours.closed && dayHours.open < earliest) {
      earliest = dayHours.open;
    }
  });
  
  return earliest;
};

/**
 * Get the latest closing time across all days
 */
export const getLatestCloseTime = (businessHours: BusinessHours): string => {
  let latest = '00:00';
  
  Object.values(businessHours).forEach(dayHours => {
    if (!dayHours.closed && dayHours.close > latest) {
      latest = dayHours.close;
    }
  });
  
  return latest;
};