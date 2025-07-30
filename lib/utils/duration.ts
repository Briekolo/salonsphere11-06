/**
 * Duration validation utilities for treatment scheduling
 * Ensures all durations are in 15-minute increments
 */

export const DURATION_INCREMENT = 15
export const MIN_DURATION = 15

/**
 * Rounds a duration value to the nearest 15-minute increment
 */
export function roundToNearest15(value: number): number {
  if (value < MIN_DURATION) return MIN_DURATION
  return Math.round(value / DURATION_INCREMENT) * DURATION_INCREMENT
}

/**
 * Validates if a duration is a valid 15-minute increment
 */
export function validateDuration(value: number): boolean {
  return value >= MIN_DURATION && value % DURATION_INCREMENT === 0
}

/**
 * Gets validation message for invalid duration
 */
export function getDurationValidationMessage(value: number): string | null {
  if (value < MIN_DURATION) {
    return `Minimale duur is ${MIN_DURATION} minuten`
  }
  
  if (value % DURATION_INCREMENT !== 0) {
    const rounded = roundToNearest15(value)
    return `Duur moet een veelvoud van ${DURATION_INCREMENT} minuten zijn. Voorgesteld: ${rounded} minuten`
  }
  
  return null
}

/**
 * Formats duration for display with validation
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}u`
  }
  
  return `${hours}u ${remainingMinutes}min`
}

/**
 * Generates common duration options in 15-minute increments
 */
export function generateDurationOptions(maxMinutes: number = 480): Array<{ value: number; label: string }> {
  const options = []
  
  for (let minutes = MIN_DURATION; minutes <= maxMinutes; minutes += DURATION_INCREMENT) {
    options.push({
      value: minutes,
      label: formatDuration(minutes)
    })
  }
  
  return options
}