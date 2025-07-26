# SalonSphere Client Module - Complete Specification

## Overview
The Client Module is a multi-tenant, client-facing booking system where each salon gets their own branded experience through custom domains or subdomains. This module handles all customer interactions from discovery to booking to post-appointment engagement.

## 🏗️ Architecture

### Multi-Tenancy Approach

#### Domain Structure
1. **Custom Domains**: `www.salonname.nl` (with DNS verification)
2. **Subdomains**: `salonname.salonsphere.nl` 
3. **Fallback URL**: `app.salonsphere.nl/salon/[slug]`

#### Tenant Resolution Flow
```
1. Request arrives at domain
2. Middleware checks domain/subdomain
3. Resolves to tenant_id
4. Loads tenant-specific settings
5. Applies branding/theme
6. Serves tenant-specific content
```

### Database Schema Extensions

```sql
-- Extend tenants table for client module
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS
  subdomain text UNIQUE,
  custom_domain text,
  domain_verified boolean DEFAULT false,
  domain_verified_at timestamptz,
  theme_settings jsonb DEFAULT '{
    "primary_color": "#02011F",
    "secondary_color": "#FE7E6D",
    "font_family": "Inter",
    "logo_position": "left"
  }'::jsonb,
  booking_settings jsonb DEFAULT '{
    "advance_booking_days": 90,
    "min_advance_hours": 24,
    "max_services_per_booking": 3,
    "require_deposit": false,
    "deposit_percentage": 20,
    "cancellation_hours": 24,
    "allow_guest_booking": true,
    "require_phone": true,
    "auto_confirm": true
  }'::jsonb,
  seo_settings jsonb DEFAULT '{
    "meta_title": null,
    "meta_description": null,
    "og_image": null,
    "keywords": []
  }'::jsonb,
  client_features jsonb DEFAULT '{
    "online_booking": true,
    "reviews": true,
    "loyalty_program": false,
    "gift_cards": false,
    "packages": false,
    "memberships": false,
    "waiting_list": false,
    "group_bookings": false
  }'::jsonb;

-- Client accounts (extends existing clients table)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  password_hash text,
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  login_count integer DEFAULT 0,
  preferred_staff_id uuid REFERENCES users(id),
  preferred_language text DEFAULT 'nl',
  notification_preferences jsonb DEFAULT '{
    "email_reminders": true,
    "sms_reminders": false,
    "marketing_emails": false,
    "review_requests": true,
    "reminder_hours": 24
  }'::jsonb,
  loyalty_points integer DEFAULT 0,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES clients(id);

-- Client sessions table
CREATE TABLE IF NOT EXISTS client_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified boolean DEFAULT true,
  is_visible boolean DEFAULT true,
  response text,
  response_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(booking_id)
);

-- Waiting list table
CREATE TABLE IF NOT EXISTS waiting_list (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id),
  preferred_date date NOT NULL,
  preferred_time_slot text, -- 'morning', 'afternoon', 'evening', 'any'
  notes text,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  notified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## 📱 Core Features

### Phase 1: Public Pages & Discovery 🚀

#### 1.1 Salon Landing Page
- **Hero Section**
  - Salon name & tagline
  - Hero image/video
  - Quick booking CTA
  - Business hours indicator
- **About Section**
  - Salon description
  - Unique selling points
  - Awards/certifications
- **Services Preview**
  - Popular services grid
  - Price ranges
  - "View all services" link
- **Location & Contact**
  - Interactive map
  - Address & directions
  - Contact methods
  - Parking information

#### 1.2 Service Catalog
- **Category Navigation**
  - Hair, Beauty, Nails, Massage, etc.
  - Service count per category
  - Category descriptions
- **Service Cards**
  - Service name & description
  - Duration & price
  - Staff who provide it
  - "Book now" button
- **Filtering & Search**
  - Price range filter
  - Duration filter
  - Staff filter
  - Text search

#### 1.3 Staff Profiles
- **Team Overview**
  - Staff grid with photos
  - Specializations tags
  - Years of experience
- **Individual Profiles**
  - Bio & qualifications
  - Services offered
  - Working days/hours
  - Portfolio gallery
  - Reviews specific to staff

#### 1.4 Gallery/Portfolio
- **Category Tabs**
  - Before/After
  - By service type
  - By staff member
- **Image Features**
  - Lightbox view
  - Service/staff tags
  - Share functionality

### Phase 2: Booking System 📅

#### 2.1 Service Selection
- **Multi-Service Booking**
  - Add multiple services
  - See total duration
  - Package suggestions
  - Add-on services

#### 2.2 Staff Selection
- **Options**
  - Specific staff member
  - "Any available" option
  - Staff availability preview
  - Staff match based on service

#### 2.3 Date & Time Selection
- **Calendar View**
  - Available dates highlighted
  - Blocked dates explained
  - First available slot
- **Time Slots**
  - Available slots based on service duration
  - Peak/off-peak pricing indicators
  - Last-minute discounts
  - Multiple staff options per slot

#### 2.4 Booking Confirmation
- **Client Details Form**
  - Name, email, phone
  - Special requests
  - First-time client questions
  - Marketing opt-in
- **Summary**
  - Services & staff
  - Date & time
  - Total price
  - Cancellation policy
- **Payment Options**
  - Pay now (online)
  - Pay at salon
  - Deposit only

### Phase 3: Client Account 👤

#### 3.1 Authentication
- **Registration**
  - Email/password
  - Social login (Google, Facebook)
  - Phone number verification
- **Login**
  - Remember me option
  - Forgot password flow
  - Magic link option

#### 3.2 Dashboard
- **Upcoming Appointments**
  - Countdown timer
  - Quick actions (reschedule, cancel)
  - Add to calendar
- **Recent Activity**
  - Past appointments
  - Reviews to write
  - Loyalty points earned

#### 3.3 Profile Management
- **Personal Information**
  - Contact details
  - Preferences (staff, services)
  - Allergies/notes
- **Notification Settings**
  - Email/SMS preferences
  - Reminder timing
  - Marketing preferences

#### 3.4 Booking History
- **Past Appointments**
  - Service details
  - Staff member
  - Price paid
  - Rebook option
- **Invoices**
  - Download PDF
  - Email receipt
  - Payment status

### Phase 4: Communication 💬

#### 4.1 Automated Emails
- **Booking Confirmation**
  - Appointment details
  - Calendar attachment
  - Directions link
  - Preparation instructions
- **Reminders**
  - 48h reminder
  - 24h reminder
  - Day-of reminder
  - Customizable timing

#### 4.2 SMS Notifications
- **Opt-in Required**
  - Booking confirmations
  - Reminders
  - Last-minute availability

#### 4.3 Two-Way Messaging
- **In-App Chat**
  - Pre-appointment questions
  - Rescheduling requests
  - After-care support
- **Notification System**
  - Push notifications
  - Email fallback
  - Read receipts

### Phase 5: Payments & Checkout 💳

#### 5.1 Payment Methods
- **Online Payments**
  - Credit/debit cards (Stripe)
  - iDEAL (Mollie)
  - PayPal
  - Buy now, pay later
- **Gift Cards**
  - Purchase online
  - Redeem at checkout
  - Balance checking

#### 5.2 Deposits & Cancellations
- **Deposit Rules**
  - Service-based requirements
  - Percentage or fixed amount
  - Refund policies
- **Cancellation Handling**
  - Grace period
  - Refund calculation
  - Credit for future use

### Phase 6: Advanced Features 🌟

#### 6.1 Loyalty Program
- **Points System**
  - Earn per € spent
  - Bonus point events
  - Tier levels
- **Rewards**
  - Service discounts
  - Free add-ons
  - Priority booking

#### 6.2 Reviews & Ratings
- **Post-Appointment**
  - Email request after 24h
  - Quick star rating
  - Detailed feedback option
- **Display**
  - Overall salon rating
  - Service-specific ratings
  - Staff ratings
  - Review responses

#### 6.3 Social Features
- **Sharing**
  - Share services
  - Refer friends
  - Social media integration
- **User Generated Content**
  - Photo uploads
  - Tagged reviews
  - Testimonials

## 🛠️ Technical Implementation

### Folder Structure
```
app/
├── (client)/                         # Client-facing routes group
│   ├── [domain]/                    # Dynamic domain routing
│   │   ├── layout.tsx              # Tenant-specific layout
│   │   ├── page.tsx                # Landing page
│   │   ├── services/               
│   │   │   ├── page.tsx           # Service catalog
│   │   │   └── [id]/page.tsx     # Service detail
│   │   ├── staff/
│   │   │   ├── page.tsx           # Team page
│   │   │   └── [id]/page.tsx     # Staff profile
│   │   ├── book/
│   │   │   ├── page.tsx           # Booking start
│   │   │   ├── select-service/    # Step 1
│   │   │   ├── select-staff/      # Step 2
│   │   │   ├── select-time/       # Step 3
│   │   │   ├── details/           # Step 4
│   │   │   └── confirm/           # Step 5
│   │   ├── account/
│   │   │   ├── layout.tsx         # Auth required
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── appointments/      # Booking history
│   │   │   ├── profile/           # Profile settings
│   │   │   └── loyalty/           # Points & rewards
│   │   ├── gallery/page.tsx       # Portfolio
│   │   ├── reviews/page.tsx       # All reviews
│   │   └── contact/page.tsx       # Contact info
│   ├── auth/
│   │   ├── login/page.tsx         # Client login
│   │   ├── register/page.tsx      # Client signup
│   │   └── forgot/page.tsx        # Password reset
│   └── layout.tsx                  # Client module layout

components/
├── client/
│   ├── booking/
│   │   ├── ServiceSelector.tsx
│   │   ├── StaffSelector.tsx
│   │   ├── CalendarPicker.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── BookingForm.tsx
│   │   └── BookingSummary.tsx
│   ├── layout/
│   │   ├── ClientHeader.tsx
│   │   ├── ClientFooter.tsx
│   │   └── ClientNav.tsx
│   ├── account/
│   │   ├── AppointmentCard.tsx
│   │   ├── LoyaltyCard.tsx
│   │   └── ProfileForm.tsx
│   └── common/
│       ├── ServiceCard.tsx
│       ├── StaffCard.tsx
│       ├── ReviewCard.tsx
│       └── LoadingSpinner.tsx

lib/
├── client/
│   ├── auth.ts                    # Client authentication
│   ├── booking.ts                 # Booking logic
│   ├── availability.ts            # Slot calculation
│   └── tenant-resolver.ts         # Domain → tenant
├── api/
│   ├── client-service.ts
│   ├── booking-service.ts
│   └── review-service.ts
└── utils/
    ├── seo.ts                     # Meta tag generation
    └── calendar.ts                # Calendar integration
```

### Domain Resolution Middleware

```typescript
// middleware.ts extension
export async function resolveClientTenant(req: NextRequest) {
  const host = req.headers.get('host') || '';
  
  // Check custom domain
  const { data: customDomain } = await supabase
    .from('tenants')
    .select('id, subdomain, theme_settings')
    .eq('custom_domain', host)
    .eq('domain_verified', true)
    .single();
    
  if (customDomain) return customDomain;
  
  // Check subdomain
  const subdomain = host.split('.')[0];
  const { data: subdomainTenant } = await supabase
    .from('tenants')
    .select('id, subdomain, theme_settings')
    .eq('subdomain', subdomain)
    .single();
    
  if (subdomainTenant) return subdomainTenant;
  
  // Check URL path
  const pathname = req.nextUrl.pathname;
  const slugMatch = pathname.match(/^\/salon\/([^\/]+)/);
  if (slugMatch) {
    const { data: slugTenant } = await supabase
      .from('tenants')
      .select('id, subdomain, theme_settings')
      .eq('subdomain', slugMatch[1])
      .single();
    return slugTenant;
  }
  
  return null;
}
```

### SEO Implementation

```typescript
// lib/client/seo.ts
export function generateMetaTags(tenant: Tenant, page: string) {
  const baseUrl = tenant.custom_domain || `${tenant.subdomain}.salonsphere.nl`;
  
  return {
    title: tenant.seo_settings?.meta_title || `${tenant.name} - ${page}`,
    description: tenant.seo_settings?.meta_description || tenant.description,
    openGraph: {
      title: tenant.seo_settings?.meta_title || tenant.name,
      description: tenant.seo_settings?.meta_description || tenant.description,
      url: `https://${baseUrl}`,
      siteName: tenant.name,
      images: [tenant.seo_settings?.og_image || tenant.logo_url],
      locale: 'nl_NL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tenant.seo_settings?.meta_title || tenant.name,
      description: tenant.seo_settings?.meta_description || tenant.description,
      images: [tenant.seo_settings?.og_image || tenant.logo_url],
    },
    alternates: {
      canonical: `https://${baseUrl}/${page}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

### Performance Optimizations

1. **Static Generation**
   - Landing pages (revalidate daily)
   - Service catalogs (revalidate hourly)
   - Staff profiles (revalidate hourly)

2. **Edge Caching**
   - Tenant settings (5 minutes)
   - Availability data (1 minute)
   - Public content (1 hour)

3. **Image Optimization**
   - Next.js Image component
   - Responsive sizes
   - WebP format
   - Lazy loading

4. **Code Splitting**
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports for heavy features

### Security Measures

1. **Client Authentication**
   - Separate auth flow from staff
   - Rate limiting on login
   - Account lockout after failures
   - Email verification required

2. **Booking Security**
   - CSRF protection
   - Honeypot fields
   - Rate limiting per IP
   - Captcha for guest bookings

3. **Data Privacy**
   - Client data encryption
   - PII masking in logs
   - Audit trails
   - GDPR compliance tools

## 📊 Analytics & Tracking

### Client Analytics
- Page views by source
- Service page engagement
- Booking funnel conversion
- Drop-off points
- Device/browser stats

### Booking Analytics
- Bookings by service
- Popular time slots
- Staff utilization
- No-show rates
- Cancellation patterns

### Revenue Analytics
- Online payment adoption
- Average booking value
- Repeat customer rate
- Lifetime value
- Revenue by channel

## 🚀 Implementation Roadmap

### Week 1-2: Foundation
- [ ] Domain routing middleware
- [ ] Tenant resolution system
- [ ] Database schema updates
- [ ] Basic folder structure
- [ ] Client layout components

### Week 3-4: Public Pages
- [ ] Landing page
- [ ] Service catalog
- [ ] Staff profiles
- [ ] SEO implementation
- [ ] Mobile responsive design

### Week 5-6: Booking System
- [ ] Service selection UI
- [ ] Calendar component
- [ ] Availability checking
- [ ] Booking flow steps
- [ ] Guest booking support

### Week 7-8: Client Accounts
- [ ] Registration/login
- [ ] Account dashboard
- [ ] Appointment management
- [ ] Profile settings
- [ ] Email notifications

### Week 9-10: Advanced Features
- [ ] Online payments
- [ ] Reviews system
- [ ] Loyalty program
- [ ] SMS notifications
- [ ] Performance optimization

### Week 11-12: Polish & Launch
- [ ] Custom domain setup
- [ ] Theme customization UI
- [ ] Analytics integration
- [ ] Load testing
- [ ] Documentation

## 🎨 Design System

### Client Module Theme
- **Colors**: Inherit from tenant theme_settings
- **Typography**: Clean, readable fonts
- **Spacing**: Generous whitespace
- **Components**: Consistent, accessible
- **Animations**: Subtle, performant

### Mobile-First Approach
- Touch-friendly tap targets (44px minimum)
- Swipeable calendars
- Bottom sheet modals
- Sticky CTAs
- Progressive disclosure

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion option

## 🔌 Integration Requirements

### Payment Providers
- **Stripe**: Cards, iDEAL, Bancontact
- **Mollie**: Dutch payment methods
- **PayPal**: International clients

### Communication
- **Twilio**: SMS notifications
- **SendGrid**: Transactional emails
- **OneSignal**: Push notifications

### Calendar
- **Google Calendar**: Sync support
- **Apple Calendar**: iCal format
- **Outlook**: .ics files

### Analytics
- **Google Analytics 4**: Page tracking
- **Mixpanel**: Event tracking
- **Hotjar**: User recordings

## 📝 Notes

### Multi-Language Support
- Primary: Dutch (nl-NL)
- Secondary: English (en-US)
- Extensible to other languages

### Compliance Requirements
- GDPR consent management
- Cookie policy
- Privacy policy per tenant
- Terms of service
- Age verification (if needed)

### Future Enhancements
- Native mobile apps
- WhatsApp integration
- AI-powered recommendations
- Virtual consultations
- Subscription services
- Marketplace features