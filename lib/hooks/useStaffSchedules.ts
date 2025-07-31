'use client';

import { useQuery } from '@tanstack/react-query';
import { AvailabilityService, StaffSchedule } from '@/lib/services/availabilityService';
import { DAY_NAMES_SHORT } from '@/types/availability';
import { supabase } from '@/lib/supabase';

export interface StaffScheduleSummary {
  staffId: string;
  schedules: StaffSchedule[];
  workingDays: string[]; // Array of day names like ['Ma', 'Di', 'Wo']
  totalHoursPerWeek: number;
  isActive: boolean;
}

export function useStaffSchedules(tenantId: string) {
  return useQuery({
    queryKey: ['staff-schedules-summary', tenantId],
    queryFn: async (): Promise<Record<string, StaffScheduleSummary>> => {
      if (!tenantId) return {};

      // Get all staff schedules for this tenant
      const { data: allSchedules, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error || !allSchedules) {
        console.error('Error fetching staff schedules:', error);
        return {};
      }

      // Group schedules by staff_id
      const staffScheduleMap: Record<string, StaffScheduleSummary> = {};

      allSchedules.forEach((schedule: StaffSchedule) => {
        const staffId = schedule.staff_id;
        
        if (!staffScheduleMap[staffId]) {
          staffScheduleMap[staffId] = {
            staffId,
            schedules: [],
            workingDays: [],
            totalHoursPerWeek: 0,
            isActive: false
          };
        }

        staffScheduleMap[staffId].schedules.push(schedule);
        staffScheduleMap[staffId].isActive = true;

        // Add day name
        const dayName = DAY_NAMES_SHORT[schedule.day_of_week];
        if (dayName && !staffScheduleMap[staffId].workingDays.includes(dayName)) {
          staffScheduleMap[staffId].workingDays.push(dayName);
        }

        // Calculate hours for this day
        const startTime = AvailabilityService.timeToMinutes(AvailabilityService.formatTime(schedule.start_time));
        const endTime = AvailabilityService.timeToMinutes(AvailabilityService.formatTime(schedule.end_time));
        const hoursThisDay = (endTime - startTime) / 60;
        staffScheduleMap[staffId].totalHoursPerWeek += hoursThisDay;
      });

      // Sort working days in logical order (Monday first)
      Object.values(staffScheduleMap).forEach(summary => {
        const dayOrder = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
        summary.workingDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      });

      return staffScheduleMap;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStaffSchedule(staffId: string, tenantId: string) {
  return useQuery({
    queryKey: ['staff-schedule', staffId, tenantId],
    queryFn: () => AvailabilityService.getStaffSchedule(staffId, tenantId),
    enabled: !!staffId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}