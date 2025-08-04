# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SalonSphere** is a multi-tenant SaaS platform for beauty salon management built with:
- **Frontend**: Next.js 15.3.3 with App Router, React 18.3.1, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **State Management**: TanStack Query v5, Jotai for client state
- **Styling**: Tailwind CSS with @tailwindcss/forms
- **UI Components**: Custom components + Lucide React icons
- **PDF Generation**: @react-pdf/renderer
- **Testing**: Playwright E2E tests
- **Validation**: Zod schemas with React Hook Form
- **Date Handling**: date-fns with timezone support

## Essential Commands

```bash
# Development
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # TypeScript type checking

# Testing
npx playwright test              # Run E2E tests
npx playwright test --ui         # Run tests with UI
npx playwright test --debug      # Debug tests
npx playwright test --project=chromium  # Run tests on specific browser

# Storybook
npm run storybook       # Start Storybook (http://localhost:6006)
npm run storybook:build # Build Storybook

# Supabase Edge Functions
./deploy-edge-functions.sh      # Deploy all edge functions
supabase functions deploy [name] # Deploy specific function
```

## Architecture Overview

### Multi-Tenant Architecture
- **Tenant Isolation**: Row Level Security (RLS) at database level
- **Tenant Context**: Stored in user metadata (`user.user_metadata.tenant_id`)
- **Domain Support**: Subdomains (`salon.salonsphere.nl`) and custom domains
- **Middleware**: Auth validation and tenant resolution in `middleware.ts`

### Module Structure
1. **Staff Module** (Main App): Dashboard, appointments, clients, inventory, invoices
2. **Admin Module** (`/admin/*`): Salon configuration, staff management, billing
3. **Client Module** (`/(client)/[domain]/*`): Public booking interface

### Database Integration
- **Supabase Client**: Type-safe client in `lib/supabase/client.ts`
- **Migrations**: Located in `supabase/migrations/`
- **RLS Policies**: All tables have tenant-based row level security
- **Real-time**: Subscriptions for live updates

### State Management Pattern
```typescript
// Custom hooks with React Query
useClients()       // Client management with search/filter
useTenant()        // Current tenant context
useBookings()      // Appointment management
useInvoices()      // Invoice operations
useTenantMetrics() // Dashboard analytics
```

### Key Services (`lib/services/`)
- `clientService.ts` - Client CRUD operations with status management
- `bookingService.ts` - Appointment logic with overlap detection
- `emailService.ts` - Email notifications (requires API key configuration)
- `availabilityService.ts` - Booking availability checks with business hours
- `treatmentSeriesService.ts` - Multi-session treatment management
- `subscriptionService.ts` - Tenant subscription and billing
- `inventoryService.ts` - Product management with stock tracking
- `notificationService.ts` - In-app notification system
- `validationService.ts` - Business rule validation

## Critical Information

### Authentication
- **Provider**: Supabase Auth
- **Test Account**: briek.seynaeve@hotmail.com / Dessaro5667!
- **Session Management**: JWT tokens with middleware validation
- **Onboarding Flow**: Enforced for users without tenant_id

### Supabase Project
- **Project ID**: drwxswnfwctstgdorhdw
- **URL**: Configured in `.env.local` (NEXT_PUBLIC_SUPABASE_URL)
- **Anon Key**: Configured in `.env.local` (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Known Issues (January 2025)
1. **Help page returns 404** - Route not implemented
2. **Email service not configured** - Requires Resend/SendGrid API keys
3. **Some placeholder content remains** - Check individual module implementations
4. **Edge function deployments** - Use provided shell scripts for deployment

### Language & Localization
- **Primary Language**: Dutch (nl-NL)
- **Date Format**: DD-MM-YYYY
- **Currency**: EUR (€)
- **Time Format**: 24-hour (HH:mm)

## Development Guidelines

### File Organization
```
app/                    # Next.js App Router pages
├── (client)/          # Client-facing booking module
├── admin/             # Admin module
├── api/               # API routes
└── [feature]/         # Feature pages (dashboard, clients, etc.)

components/            # React components
├── [feature]/         # Feature-specific components
├── layout/           # Layout components (Sidebar, TopBar)
├── providers/        # Context providers
└── ui/              # Reusable UI components

lib/                  # Utilities and services
├── hooks/           # Custom React hooks
├── services/        # Business logic services
├── supabase/        # Database client
└── utils/           # Helper functions
```

### Common Patterns
1. **Data Fetching**: Always use custom hooks with React Query
2. **Error Handling**: Display user-friendly Dutch error messages
3. **Loading States**: Use skeleton components or "Laden..." text
4. **Multi-tenancy**: Always include tenant_id in queries
5. **Type Safety**: Use generated database types from `types/database.ts`

### Testing Approach
- **E2E Tests**: Playwright for user flows (configured for chromium, firefox, webkit)
- **Component Development**: Storybook for isolated component testing
- **Type Checking**: Run `npm run type-check` before committing
- **Test Location**: Tests located in `/tests/` directory
- **CI/CD**: Configured with automatic retries and HTML reporting

### Security Considerations
- **RLS Policies**: Never bypass tenant isolation
- **API Keys**: Store in environment variables only
- **User Input**: Always validate and sanitize
- **File Uploads**: Validate file types and sizes

## Useful Documentation References

- `/docs/RISK_ANALYSIS.md` - Security and compliance analysis
- `/docs/DATABASE_SETUP.md` - Database configuration guide
- `/docs/DOMAIN.md` - Domain and subdomain setup
- `/docs/SECURITY_AUDIT_REPORT.md` - Security audit findings
- `/types/database.ts` - Generated database types from Supabase
- `/types/booking.ts` - Booking system types
- `/types/notification.ts` - Notification system types
- `/types/staff.ts` - Staff management types

## Important Instructions

### Before Making Changes
1. **Always run type-check**: `npm run type-check` before committing
2. **Test changes**: Use Playwright tests to verify functionality
3. **Check tenant isolation**: Ensure all database queries include tenant_id
4. **Validate business hours**: Use business hours validation for bookings
5. **Dutch language**: All user-facing text should be in Dutch

### Edge Functions Deployment
- Use `./deploy-edge-functions.sh` for all functions
- Individual deployment: `supabase functions deploy [function-name]`
- Functions handle timezone-aware booking reminders and email automation

### Database Migrations
- Located in `/supabase/migrations/`
- Apply with Supabase CLI or through dashboard
- Always test migrations on development first