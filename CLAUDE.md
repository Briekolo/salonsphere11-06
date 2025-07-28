# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SalonSphere** is a multi-tenant SaaS platform for beauty salon management built with:
- **Frontend**: Next.js 15.3.3 with App Router, React 18.3.1, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **State Management**: TanStack Query v5
- **Styling**: Tailwind CSS
- **PDF Generation**: @react-pdf/renderer
- **Testing**: Playwright

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

# Storybook
npm run storybook       # Start Storybook (http://localhost:6006)
npm run storybook:build # Build Storybook
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
- `clientService.ts` - Client CRUD operations
- `bookingService.ts` - Appointment logic
- `invoiceService.ts` - Billing operations
- `emailService.ts` - Email notifications (requires API key configuration)
- `pdfService.ts` - PDF generation for invoices
- `availabilityService.ts` - Booking availability checks

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
1. **Invoice tables not created** - Migration needs to be applied
2. **Help page returns 404** - Route not implemented
3. **Email service not configured** - Requires Resend/SendGrid API keys
4. **Several modules show placeholder content** - Marketing, Treatments, Settings

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
- **E2E Tests**: Playwright for user flows
- **Component Development**: Storybook for isolated component testing
- **Type Checking**: Run `npm run type-check` before committing

### Security Considerations
- **RLS Policies**: Never bypass tenant isolation
- **API Keys**: Store in environment variables only
- **User Input**: Always validate and sanitize
- **File Uploads**: Validate file types and sizes

## Useful Documentation References

- `/docs/TODO.md` - Comprehensive task list (290+ items)
- `/docs/CLIENT-MODULE.md` - Client module specification
- `/docs/ADMIN.md` - Admin module progress
- `/docs/RISK_ANALYSIS.md` - Security and compliance analysis
- `/types/database.ts` - Generated database types
- `/types/invoice.ts` - Invoice system types