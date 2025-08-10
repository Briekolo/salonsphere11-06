/**
 * Shared timezone utilities for Belgium (Europe/Brussels)
 * Handles proper timezone conversion and formatting for email notifications
 */

/**
 * Check if a given date is in Daylight Saving Time for Belgium/Brussels
 * DST runs from last Sunday of March at 01:00 UTC to last Sunday of October at 01:00 UTC
 * At 01:00 UTC (02:00 local), clocks move forward to 03:00 local (DST starts)
 * At 01:00 UTC (03:00 local), clocks move back to 02:00 local (DST ends)
 */
export function isBelgiumDST(date: Date): boolean {
  const year = date.getUTCFullYear()
  
  // Get last Sunday of March at 01:00 UTC (start of DST)
  const marchLastSunday = new Date(Date.UTC(year, 2, 31, 1, 0, 0)) // March 31 at 01:00 UTC
  marchLastSunday.setUTCDate(31 - marchLastSunday.getUTCDay())
  
  // Get last Sunday of October at 01:00 UTC (end of DST)
  const octoberLastSunday = new Date(Date.UTC(year, 9, 31, 1, 0, 0)) // October 31 at 01:00 UTC
  octoberLastSunday.setUTCDate(31 - octoberLastSunday.getUTCDay())
  
  // Check if date is between last Sunday of March at 01:00 UTC and last Sunday of October at 01:00 UTC
  return date >= marchLastSunday && date < octoberLastSunday
}

/**
 * Get the UTC offset for Belgium timezone
 * Returns 2 for summer time (CEST), 1 for winter time (CET)
 */
export function getBelgiumOffset(date: Date): number {
  return isBelgiumDST(date) ? 2 : 1
}

/**
 * Get the timezone abbreviation for Belgium
 * Returns "CEST" for summer time, "CET" for winter time
 */
export function getBelgiumTimezoneAbbr(date: Date): string {
  return isBelgiumDST(date) ? 'CEST' : 'CET'
}

/**
 * Convert UTC date to Belgium local time
 */
export function convertToBelgiumTime(utcDate: Date): Date {
  const offset = getBelgiumOffset(utcDate)
  return new Date(utcDate.getTime() + (offset * 60 * 60 * 1000))
}

/**
 * Format time for Belgium with timezone indicator
 * Returns format like "14:30 CEST"
 */
export function formatBelgiumTime(utcDate: Date): string {
  const localDate = convertToBelgiumTime(utcDate)
  const hours = localDate.getUTCHours()
  const minutes = localDate.getUTCMinutes()
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const tzAbbr = getBelgiumTimezoneAbbr(utcDate)
  return `${timeFormatted} ${tzAbbr}`
}

/**
 * Format date for Belgium locale
 */
export function formatBelgiumDate(utcDate: Date): string {
  // Convert to Belgium time first to get correct day
  const localDate = convertToBelgiumTime(utcDate)
  
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  
  // Use UTC methods on the converted local date since we've already applied the offset
  const dayName = days[localDate.getUTCDay()]
  const day = localDate.getUTCDate()
  const month = months[localDate.getUTCMonth()]
  const year = localDate.getUTCFullYear()
  
  return `${dayName} ${day} ${month} ${year}`
}

/**
 * Format appointment time range with timezone
 * Returns format like "14:30 - 15:00 CEST"
 */
export function formatAppointmentTimeRange(startDate: Date, durationMinutes: number): {
  timeFormatted: string
  endTimeFormatted: string
  dateFormatted: string
  timezoneAbbr: string
  timezoneNotice: string
} {
  // Debug logging for incoming date
  console.log('[TIMEZONE-DEBUG] formatAppointmentTimeRange input:', {
    startDate: startDate.toISOString(),
    startDateLocal: startDate.toString(),
    durationMinutes
  })
  
  const localStartDate = convertToBelgiumTime(startDate)
  const localEndDate = new Date(localStartDate.getTime() + durationMinutes * 60000)
  
  const startHours = localStartDate.getUTCHours()
  const startMinutes = localStartDate.getUTCMinutes()
  const endHours = localEndDate.getUTCHours()
  const endMinutes = localEndDate.getUTCMinutes()
  
  const timeFormatted = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`
  const endTimeFormatted = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  const dateFormatted = formatBelgiumDate(startDate)
  const timezoneAbbr = getBelgiumTimezoneAbbr(startDate)
  
  // Debug logging for output
  console.log('[TIMEZONE-DEBUG] formatAppointmentTimeRange output:', {
    localStartDate: localStartDate.toISOString(),
    timeFormatted,
    endTimeFormatted,
    dateFormatted,
    timezoneAbbr,
    offset: getBelgiumOffset(startDate)
  })
  
  return {
    timeFormatted,
    endTimeFormatted,
    dateFormatted,
    timezoneAbbr,
    timezoneNotice: 'Alle tijden zijn weergegeven in Belgische tijd (Europe/Brussels)'
  }
}

/**
 * Log timezone conversion for debugging
 */
export function logTimezoneConversion(originalDate: Date, context: string) {
  const isDST = isBelgiumDST(originalDate)
  const offset = getBelgiumOffset(originalDate)
  const localDate = convertToBelgiumTime(originalDate)
  const formatted = formatBelgiumTime(originalDate)
  
  console.log(`[${context}] Belgium timezone conversion:`, {
    original: originalDate.toISOString(),
    originalString: originalDate.toString(),
    isDST,
    offset: `UTC+${offset}`,
    localTime: localDate.toISOString(),
    localTimeString: localDate.toString(),
    formatted,
    timezone: 'Europe/Brussels',
    currentTime: new Date().toISOString()
  })
}