# Product Requirements Document (PRD) - SalonSphere

## Product Overview
SalonSphere is a comprehensive multi-tenant SaaS platform designed for beauty salon management. It provides an all-in-one solution for appointment scheduling, client management, inventory tracking, staff management, and business analytics.

## Key Features

### 1. Authentication & User Management
- Multi-provider authentication (Supabase Auth)
- Role-based access control (Admin, Staff, Client)
- Multi-tenant architecture with tenant isolation
- Session management with JWT tokens

### 2. Dashboard & Analytics
- Real-time business metrics and KPIs
- Revenue analytics and growth indicators
- Appointment statistics and trends
- Inventory status monitoring
- Popular services tracking
- Conversion funnel analysis

### 3. Appointment Management
- Interactive calendar with multiple views (Day, Week, Month)
- Drag-and-drop appointment scheduling
- Availability checking and conflict detection
- Recurring appointments support
- Treatment series management
- Real-time updates

### 4. Client Management
- Comprehensive client database
- Client status tracking (Active, Inactive, VIP)
- Search and filter capabilities
- Appointment history
- Client notes and preferences

### 5. Inventory Management
- Product catalog with categories
- Stock level monitoring
- Low stock alerts
- Purchase order management
- Usage tracking
- Inventory reports

### 6. Service/Treatment Management
- Service catalog with pricing
- Service duration settings
- Category management
- Staff assignments
- Treatment packages

### 7. Staff Management
- Staff profiles and roles
- Availability scheduling
- Performance tracking
- Commission management
- Individual calendars

### 8. Business Settings
- Opening hours configuration
- Booking rules (advance booking, cancellation policies)
- Payment method settings
- Tax configuration
- Notification preferences

### 9. Client Booking Portal
- Public booking interface
- Service selection
- Staff preference
- Available time slots
- Booking confirmation

### 10. Payment & Billing
- Mollie payment integration
- Subscription management
- Invoice generation
- Payment tracking

## Technical Architecture
- Frontend: Next.js 15.3.3 with TypeScript
- Backend: Supabase (PostgreSQL, Auth, Realtime)
- State Management: TanStack Query, Jotai
- UI: Tailwind CSS with custom components
- Testing: Playwright E2E tests

## User Roles

### Admin
- Full system access
- Business configuration
- Staff management
- Financial reports
- Subscription management

### Staff
- Personal calendar management
- Client appointments
- Limited client access
- Personal availability

### Client
- Appointment booking
- Appointment history
- Profile management

## Security & Compliance
- Row Level Security (RLS) at database level
- Tenant isolation
- GDPR compliance features
- Secure payment processing

## Localization
- Primary Language: Dutch (nl-NL)
- Date Format: DD-MM-YYYY
- Currency: EUR (€)
- Time Format: 24-hour