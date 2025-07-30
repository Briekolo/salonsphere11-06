import { format, addMinutes, isAfter, isBefore, isEqual } from 'date-fns'

export interface AppointmentWithOverlap {
  id: string
  scheduled_at: string
  duration_minutes: number
  // Position data for rendering
  position?: {
    column: number
    totalColumns: number
    width: number
    left: number
  }
}

export interface OverlapGroup {
  appointments: AppointmentWithOverlap[]
  startTime: Date
  endTime: Date
  totalColumns: number
}

/**
 * Check if two appointments overlap in time
 */
export function appointmentsOverlap(
  appointment1: AppointmentWithOverlap,
  appointment2: AppointmentWithOverlap
): boolean {
  const start1 = new Date(appointment1.scheduled_at)
  const end1 = addMinutes(start1, appointment1.duration_minutes)
  
  const start2 = new Date(appointment2.scheduled_at)
  const end2 = addMinutes(start2, appointment2.duration_minutes)
  
  // Check if appointments overlap (not just touching)
  return (
    (isAfter(start1, start2) || isEqual(start1, start2)) && isBefore(start1, end2) ||
    (isAfter(start2, start1) || isEqual(start2, start1)) && isBefore(start2, end1)
  )
}

/**
 * Find all overlapping appointments and group them
 */
export function findOverlapGroups(appointments: AppointmentWithOverlap[]): OverlapGroup[] {
  const groups: OverlapGroup[] = []
  const processed = new Set<string>()
  
  for (const appointment of appointments) {
    if (processed.has(appointment.id)) continue
    
    // Start a new group with this appointment
    const group = [appointment]
    processed.add(appointment.id)
    
    // Keep checking for overlaps until no new overlaps are found
    let foundNewOverlap = true
    while (foundNewOverlap) {
      foundNewOverlap = false
      
      for (const otherAppointment of appointments) {
        if (processed.has(otherAppointment.id)) continue
        
        // Check if this appointment overlaps with ANY appointment in the current group
        const overlapsWithGroup = group.some(groupAppointment => 
          appointmentsOverlap(groupAppointment, otherAppointment)
        )
        
        if (overlapsWithGroup) {
          group.push(otherAppointment)
          processed.add(otherAppointment.id)
          foundNewOverlap = true
        }
      }
    }
    
    // Sort by start time
    group.sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )
    
    // Calculate group time range
    const startTimes = group.map(a => new Date(a.scheduled_at))
    const endTimes = group.map(a => 
      addMinutes(new Date(a.scheduled_at), a.duration_minutes)
    )
    
    const startTime = new Date(Math.min(...startTimes.map(t => t.getTime())))
    const endTime = new Date(Math.max(...endTimes.map(t => t.getTime())))
    
    groups.push({
      appointments: group,
      startTime,
      endTime,
      totalColumns: group.length
    })
  }
  
  return groups
}

/**
 * Calculate positioning for overlapping appointments
 */
export function calculateAppointmentPositions(
  appointments: AppointmentWithOverlap[],
  maxColumns: number = 4
): AppointmentWithOverlap[] {
  if (!appointments || appointments.length === 0) {
    return []
  }

  const groups = findOverlapGroups(appointments)
  const result: AppointmentWithOverlap[] = []
  
  
  for (const group of groups) {
    const { appointments: groupAppointments, totalColumns } = group
    
    // If we have too many overlapping appointments, limit to maxColumns
    const actualColumns = Math.min(totalColumns, maxColumns)
    const columnWidth = 100 / actualColumns // Percentage width per column
    
    groupAppointments.forEach((appointment, index) => {
      const column = index < maxColumns ? index : maxColumns - 1
      const isOverflowColumn = index >= maxColumns - 1 && totalColumns > maxColumns
      
      result.push({
        ...appointment,
        position: {
          column,
          totalColumns: actualColumns,
          width: columnWidth,
          left: column * columnWidth
        }
      })
    })
  }
  
  // Add appointments that don't overlap with anything
  const groupedIds = new Set(groups.flatMap(g => g.appointments.map(a => a.id)))
  for (const appointment of appointments) {
    if (!groupedIds.has(appointment.id)) {
      result.push({
        ...appointment,
        position: {
          column: 0,
          totalColumns: 1,
          width: 100,
          left: 0
        }
      })
    }
  }
  
  return result
}

/**
 * Get appointments for a specific time slot with overlap calculation
 */
export function getAppointmentsForTimeSlot(
  appointments: AppointmentWithOverlap[],
  slotDate: Date,
  slotDurationMinutes: number = 60
): AppointmentWithOverlap[] {
  const slotEnd = addMinutes(slotDate, slotDurationMinutes)
  
  // Find appointments that fall within or overlap with this time slot
  const slotAppointments = appointments.filter(appointment => {
    const appointmentStart = new Date(appointment.scheduled_at)
    const appointmentEnd = addMinutes(appointmentStart, appointment.duration_minutes)
    
    // Check if appointment overlaps with the time slot
    return (
      (isAfter(appointmentStart, slotDate) || isEqual(appointmentStart, slotDate)) && isBefore(appointmentStart, slotEnd) ||
      (isAfter(slotDate, appointmentStart) || isEqual(slotDate, appointmentStart)) && isBefore(slotDate, appointmentEnd)
    )
  })
  
  return calculateAppointmentPositions(slotAppointments)
}

/**
 * Get overflow count for display (e.g., "+2 more")
 */
export function getOverflowCount(totalAppointments: number, maxVisible: number): number {
  return Math.max(0, totalAppointments - maxVisible)
}