/**
 * Shared timezone utilities for Belgium (Europe/Brussels)
 * Handles proper timezone conversion and formatting for email notifications
 */

/**
 * Check if a given date is in Daylight Saving Time for Belgium/Brussels
 * DST runs from last Sunday of March to last Sunday of October
 */
export function isBelgiumDST(date: Date): boolean {
  const year = date.getUTCFullYear()
  
  // Get last Sunday of March (start of DST)
  const marchLastSunday = new Date(Date.UTC(year, 2, 31)) // March 31
  marchLastSunday.setUTCDate(31 - marchLastSunday.getUTCDay())
  
  // Get last Sunday of October (end of DST)
  const octoberLastSunday = new Date(Date.UTC(year, 9, 31)) // October 31
  octoberLastSunday.setUTCDate(31 - octoberLastSunday.getUTCDay())
  
  // Check if date is between last Sunday of March and last Sunday of October
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
export function formatBelgiumDate(date: Date): string {
  // Note: toLocaleDateString might not work correctly in Deno environment
  // Using manual formatting for consistency
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  
  const dayName = days[date.getUTCDay()]
  const day = date.getUTCDate()
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  
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
    isDST,
    offset,
    localTime: localDate.toISOString(),
    formatted,
    timezone: 'Europe/Brussels'
  })
}