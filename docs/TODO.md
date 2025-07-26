# SalonSphere TODO List

## 🚨 Critical Issues

### Database/Backend Issues
- [ ] Invoice tables not created in Supabase - migration needs to be applied
- [ ] Fix invoice loading issue - currently shows "Facturen laden..." indefinitely
- [ ] Missing RPC functions in Supabase (tenant_metrics, revenue_timeseries)

## 📄 Missing Pages

### Help Page
- [ ] Create `/app/help/page.tsx` - currently returns 404
- [ ] Add help content and documentation
- [ ] Include FAQs and support contact information

### Analytics Page
- [ ] `/app/dashboard` referenced in sidebar but shows placeholder content
- [ ] Implement comprehensive analytics dashboard

### Reports Page
- [ ] `/app/reports` exists but needs implementation
- [ ] Add revenue reports, staff performance, client analytics

## 🔧 Non-Functional Features

### Marketing Module (/marketing)
- [ ] Implement MarketingContent component
- [ ] Add email campaign management
- [ ] Create customer segmentation features
- [ ] Add promotional campaign tracking
- [ ] Implement SMS marketing capabilities
- [ ] Add loyalty program management

### Treatments Module (/treatments)
- [x] Implement TreatmentsContent component
- [x] Add treatment categories management
- [ ] Create service pricing tiers
- [ ] Add treatment duration settings
- [ ] Implement treatment packages/bundles
- [x] Add staff-treatment assignments
- [x] Add overhead cost calculation per treatment
- [x] Integrate overhead percentage in pricing calculator
- [x] Create overhead analytics dashboard widget

### Settings Page (/settings)
- [ ] Implement SettingsContent component
- [ ] Add business information management
- [ ] Create opening hours configuration
- [ ] Add notification preferences
- [ ] Implement booking rules settings
- [ ] Add payment method configuration
- [ ] Create tax settings management

### Appointments Page (/appointments)
- [ ] Full appointment management interface
- [ ] Implement recurring appointments
- [ ] Add group bookings functionality

### Inventory Page (/inventory)
- [ ] Purchase order workflow
- [ ] Supplier management
- [ ] Automated reordering
- [ ] Barcode scanning
- [ ] Expiry date management

## 🔘 Non-Functional Buttons/Features

### Dashboard
- [ ] "Opslaan" button for revenue goal - needs backend persistence
- [ ] Revenue goal settings don't save across sessions
- [ ] Recent activity shows hardcoded fallback data instead of real data
- [ ] Quick action buttons lead to incomplete pages

### Invoice System
- [ ] Email sending via Edge Functions not configured
- [ ] PDF generation may fail due to missing fonts
- [ ] Batch invoice sending needs testing
- [ ] Payment reminder automation not implemented
- [ ] Invoice creation from bookings not working (createInvoice: true flag ignored)

### Client Booking Flow
- [ ] Step 4: Client details form - not implemented
- [ ] Step 5: Booking confirmation - not implemented
- [ ] Email confirmation after booking not sent
- [ ] SMS notifications not implemented
- [ ] Cancellation/rescheduling from client side missing
- [ ] Client authentication system (Module 4) not implemented
- [ ] Client account dashboard (Module 4) not created
- [ ] Appointment management pages (Module 5) not created
- [ ] Guest booking support not implemented

### Calendar/Agenda
- [ ] Week view drag & drop not implemented
- [ ] Staff column view missing
- [ ] Touch/mobile support for drag & drop
- [ ] Resource view (rooms/equipment) not available
- [ ] Buffer time management not implemented
- [ ] Holiday/exception handling missing

## 🎨 UI/UX Improvements Needed

### Mobile Responsiveness
- [ ] Test and fix mobile layouts for all pages
- [ ] Improve touch targets on mobile devices
- [ ] Fix sidebar behavior on mobile screens
- [ ] Calendar mobile experience needs work

### Admin Panel
- [ ] Some admin subpages show placeholder content
- [ ] Admin user management page needs implementation
- [ ] Admin billing/subscription page incomplete
- [ ] Security settings page needs content
- [ ] Integrations page needs implementation
- [x] Overhead settings page implemented
- [x] Monthly overhead configuration added

### General UI Issues
- [ ] Loading states missing in some components
- [ ] Error boundaries not implemented everywhere
- [ ] Inconsistent spacing in some areas
- [ ] Some forms lack proper validation feedback

## 🔌 Integration Tasks

### Payment Integration
- [ ] Integrate Stripe for credit card payments
- [ ] Integrate Mollie for Dutch payment methods (iDEAL)
- [ ] Add payment method management
- [ ] Implement automatic payment processing
- [ ] Add refund functionality
- [ ] Handle failed payments
- [ ] Payment reconciliation dashboard

### Communication
- [ ] Configure email service (Resend/SendGrid)
- [ ] Set up SMS provider integration
- [ ] Implement WhatsApp Business API
- [ ] Add push notifications
- [ ] Email template editor
- [ ] Automated email campaigns

### External Services
- [ ] Google Calendar sync
- [ ] iCal feed generation
- [ ] Accounting software integration (Exact Online, QuickBooks)
- [ ] Social media posting integration
- [ ] Review platform integrations (Google, Facebook)

## 🛡️ Security & Compliance

### Security
- [ ] Implement rate limiting
- [ ] Add 2FA for admin accounts
- [ ] Create audit logs for sensitive actions
- [ ] Add IP whitelisting for admin access
- [ ] Implement session timeout management

### GDPR/AVG Compliance
- [ ] Add privacy policy page
- [ ] Implement cookie consent banner
- [ ] Create data export functionality
- [ ] Add data deletion (right to be forgotten)
- [ ] Implement consent management
- [ ] Add data processing agreements

## 📊 Analytics & Reporting

### Missing Analytics Features
- [ ] Staff performance metrics
- [ ] Client retention analytics
- [ ] Revenue forecasting
- [ ] Booking conversion funnel
- [ ] Service popularity trends
- [ ] Inventory usage reports
- [ ] No-show analysis
- [ ] Peak hours analysis
- [x] Overhead cost analysis and tracking
- [x] Treatment profitability calculation

### Data Export
- [ ] Add CSV export for all data types
- [ ] Implement PDF report generation
- [ ] Create automated report scheduling
- [ ] Add custom report builder

## 🧪 Testing & Documentation

### Testing
- [ ] Add unit tests for critical functions
- [ ] Implement E2E tests with Playwright
- [ ] Add integration tests for API endpoints
- [ ] Create test data seeders
- [ ] Performance testing for calendar with many appointments

### Documentation
- [ ] Create API documentation
- [ ] Add inline code documentation
- [ ] Create user manual
- [ ] Add deployment guide
- [ ] Create onboarding tutorials
- [ ] Add video guides

## 🚀 Future Features

### Advanced Booking
- [ ] Group bookings functionality
- [ ] Package deals (multiple services)
- [ ] Membership/subscription services
- [ ] Waiting list management
- [ ] Resource scheduling (rooms, equipment)
- [ ] Multi-location booking

### Client Features
- [ ] Client self-service portal completion
- [ ] Online consultation forms
- [ ] Photo gallery for before/after
- [ ] Review and rating system
- [ ] Referral program
- [ ] Client preferences and notes
- [ ] Treatment history tracking

### Business Intelligence
- [ ] Predictive analytics
- [ ] Demand forecasting
- [ ] Automated pricing suggestions
- [ ] Competitor analysis tools
- [ ] Market trends analysis
- [ ] Customer lifetime value calculation

### Staff Features
- [ ] Commission tracking
- [ ] Performance bonuses
- [ ] Shift swapping
- [ ] Time-off requests
- [ ] Training management
- [ ] Goal setting and tracking

## 🐛 Known Bugs

### Critical Bugs
- [ ] Invoice system not loading - tables missing in database
- [ ] Tenant context sometimes undefined in hooks
- [ ] Recent activities showing fallback data
- [ ] Some API calls return 404 due to missing routes

### Minor Bugs
- [ ] Calendar performance issues with many appointments
- [ ] Drag and drop sometimes doesn't update UI immediately
- [ ] Form validation messages inconsistent
- [ ] Some tooltips cut off on mobile
- [ ] Image uploads may fail for large files

## 🔧 Technical Debt

### Code Quality
- [ ] Remove console.log statements from production
- [ ] Standardize error handling across the app
- [ ] Reduce component complexity in some areas
- [ ] Add proper TypeScript types for all API responses
- [ ] Remove any 'any' types

### Performance
- [ ] Implement virtual scrolling for long lists
- [ ] Add lazy loading for heavy components
- [ ] Optimize bundle size
- [ ] Implement proper caching strategies
- [ ] Add service workers for offline support

### Database
- [ ] Add missing indexes for performance
- [ ] Optimize complex queries
- [ ] Implement database connection pooling
- [ ] Add data archiving for old records
- [ ] Create database backup automation
- [x] Add overhead_monthly field to tenants table
- [x] Create overhead calculation RPC functions

## 📝 Configuration & Setup

### Environment Variables
- [ ] Document all required environment variables
- [ ] Add environment variable validation
- [ ] Create .env.example file
- [ ] Add secrets management

### Deployment
- [ ] Create production deployment guide
- [ ] Add CI/CD pipeline
- [ ] Implement staging environment
- [ ] Add rollback procedures
- [ ] Create monitoring and alerting

## Priority Order for Implementation

1. **Fix Critical Issues** (Invoice system, missing pages)
2. **Complete Client Booking Flow** (Steps 4-5)
3. **Payment Integration** (Stripe/Mollie)
4. **Email/SMS Integration**
5. **Complete Missing Modules** (Marketing, Treatments, Settings)
6. **GDPR Compliance**
7. **Mobile Optimization**
8. **Advanced Features**