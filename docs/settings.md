# Settings Page Implementation

## Overview
Implementation of the main Settings page (/settings) with comprehensive salon management features accessible to staff members.

## Current State
- Settings page exists but shows placeholder content
- Admin settings already implemented in `/admin/settings/`
- Need to create staff-accessible settings in main `/settings` route

## Implementation Checklist

### Database & Infrastructure
- [ ] Create database migration for `notification_preferences` JSON field
- [ ] Create database migration for `payment_methods` JSON field
- [ ] Update types/database.ts with new fields

### Core Components
- [ ] Update SettingsContent component with tab navigation structure
- [ ] Create shared settings types and interfaces
- [ ] Add settings data fetching hooks

### Tab Components
- [ ] Create BusinessInfoTab component
  - [ ] Reuse logic from `/admin/settings/page.tsx`
  - [ ] Fields: name, email, phone, website, address, VAT, KvK
- [ ] Create OpeningHoursTab component
  - [ ] Reuse logic from `/admin/settings/hours/page.tsx`
  - [ ] Weekly schedule with open/close times
  - [ ] Closed day toggles and copy functionality
- [ ] Create NotificationPreferencesTab component
  - [ ] Email notification toggles (bookings, cancellations, reminders)
  - [ ] SMS notification settings
  - [ ] Staff notification preferences
- [ ] Create BookingRulesTab component
  - [ ] Minimum/maximum booking advance time
  - [ ] Cancellation policy settings
  - [ ] Buffer time between appointments
  - [ ] Online booking availability toggle
- [ ] Create PaymentMethodsTab component
  - [ ] Accepted payment types (cash, card, bank transfer)
  - [ ] Default payment terms
  - [ ] Online payment gateway settings (placeholder)
- [ ] Create TaxSettingsTab component
  - [ ] Reuse logic from `/admin/settings/tax/page.tsx`
  - [ ] VAT rates configuration
  - [ ] Tax inclusion in prices

### Access Control & UX
- [ ] Implement permission checks using `useIsAdmin` hook
- [ ] Add view-only mode for non-admin staff
- [ ] Add loading states and error handling
- [ ] Include save confirmation messages
- [ ] Ensure Dutch language consistency

### Testing & Validation
- [ ] Test with admin users (full edit access)
- [ ] Test with non-admin staff (view-only)
- [ ] Validate all form inputs and data persistence
- [ ] Test tab navigation and state management

## Component Structure
```
components/settings/
├── SettingsContent.tsx (update existing)
├── BusinessInfoTab.tsx
├── OpeningHoursTab.tsx
├── NotificationPreferencesTab.tsx
├── BookingRulesTab.tsx
├── PaymentMethodsTab.tsx
└── TaxSettingsTab.tsx
```

## Database Schema Additions
```sql
-- Add to tenants table
notification_preferences JSON NULL,
payment_methods JSON NULL
```

## Notes
- Follow existing card-based layout patterns
- Use consistent styling with admin settings pages
- Implement proper error handling and validation
- Maintain Dutch language conventions throughout