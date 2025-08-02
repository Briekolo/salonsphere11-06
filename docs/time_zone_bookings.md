# Timezone Handling for Booking Emails - Belgium

## Overview
This document describes the timezone handling for SalonSphere's email notification system, specifically configured for Belgium (Europe/Brussels). The system ensures all appointment times in emails are displayed correctly in Belgian time with clear timezone indicators.

## Issue Description
- **Problem**: Email notifications displayed appointment times incorrectly (2 hours early)
- **Root Cause**: Deno edge function environment wasn't properly handling timezone conversions
- **Affected Functions**: 
  - `send-booking-confirmation`
  - `send-booking-reminder`
  - `send-payment-reminder`

## Current Solution (Belgium-Specific)
As of August 2025, a proper timezone handling system has been implemented for Belgium:

### Shared Timezone Utility
Created `/supabase/functions/_shared/timezone.ts` with:
- DST-aware calculations for Belgium (Europe/Brussels)
- Proper timezone abbreviation (CET/CEST)
- Consistent date/time formatting functions

### Key Functions:
```typescript
// Check if date is in Belgium DST
isBelgiumDST(date: Date): boolean

// Get Belgium UTC offset (1 or 2)
getBelgiumOffset(date: Date): number

// Format time with timezone: "14:30 CEST"
formatBelgiumTime(utcDate: Date): string

// Complete appointment formatting
formatAppointmentTimeRange(startDate: Date, durationMinutes: number)
```

### Email Display Format
- Time display: `14:30 - 15:00 CEST` (includes timezone abbreviation)
- Footer notice: "Alle tijden zijn weergegeven in Belgische tijd (Europe/Brussels)"
- Clear timezone indication throughout all emails

## Edge Functions Deployment

### Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Login: `supabase login`
3. Link project: `supabase link --project-ref drwxswnfwctstgdorhdw`

### Deployment Commands
```bash
# Deploy all functions with Belgium timezone
./deploy-edge-functions-belgium.sh

# Or deploy individual functions
supabase functions deploy send-booking-confirmation
supabase functions deploy send-booking-reminder
supabase functions deploy send-payment-reminder
```

### Monitoring
```bash
# View logs for debugging
supabase functions logs send-booking-confirmation
supabase functions logs send-booking-reminder
```

## Debug Information
The edge functions include comprehensive logging for Belgium timezone:

Example debug output:
```
[Booking Confirmation] Belgium timezone conversion: {
  original: '2025-08-06T09:00:00.000Z',
  isDST: true,
  offset: 2,
  localTime: '2025-08-06T11:00:00.000Z',
  formatted: '11:00 CEST',
  timezone: 'Europe/Brussels'
}
```

### Belgium DST Rules
- **Summer Time (CEST/UTC+2)**: Last Sunday of March to last Sunday of October
- **Winter Time (CET/UTC+1)**: Rest of the year
- Automatic adjustment based on appointment date

## Permanent Solution Recommendations

### Option 1: Timezone Library
Implement a proper timezone library that supports Deno:
- Consider `date-fns-tz` or similar Deno-compatible libraries
- Properly handle DST transitions automatically

### Option 2: Application Layer Formatting
Pass pre-formatted date/time strings from the application:
- Format times in the Next.js application where timezone libraries work reliably
- Pass formatted strings to edge functions via database or parameters

### Option 3: Database Storage
Store appointment times with timezone information:
- Add timezone field to bookings table
- Store local time alongside UTC time

### Option 4: Use Intl API
Leverage the built-in Intl.DateTimeFormat API if Deno support improves:
```typescript
const formatter = new Intl.DateTimeFormat('nl-NL', {
  timeZone: 'Europe/Amsterdam',
  hour: '2-digit',
  minute: '2-digit'
})
```

## Automatic DST Handling
The Belgium timezone utility automatically handles DST transitions:
- No manual intervention required when DST changes
- Automatically uses CET (UTC+1) in winter
- Automatically uses CEST (UTC+2) in summer
- Transition dates are calculated dynamically

## Testing Checklist
After any timezone-related changes:
1. Create test appointment
2. Verify confirmation email shows correct time
3. Check edge function logs for debug output
4. Test with appointments at different times of day
5. Verify both confirmation and reminder emails

## Implementation Summary
1. **Centralized timezone logic** in `_shared/timezone.ts`
2. **Belgium-specific calculations** for Europe/Brussels
3. **Clear timezone indicators** in all emails (CET/CEST)
4. **Automatic DST handling** with no manual updates needed
5. **Consistent formatting** across all edge functions

## Contact for Issues
If timezone issues persist:
1. Check edge function logs first
2. Verify deployment was successful
3. Ensure Resend API key is configured
4. Review this documentation for troubleshooting steps