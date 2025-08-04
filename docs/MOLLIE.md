# Mollie Payment Integration Plan

## 📋 Overview
Implement Mollie subscription payments for SalonSphere Pro (€79/month) with complete integration from signup to recurring billing management.

## 🏗️ Database Schema Changes

### 1. New Tables
- **`subscriptions`** - Store Mollie subscription data
  - `id`, `tenant_id`, `mollie_customer_id`, `mollie_subscription_id`
  - `status`, `plan_name`, `amount`, `currency`, `interval`
  - `next_payment_at`, `cancelled_at`, `trial_end_at`
  - `webhook_url`, `created_at`, `updated_at`

- **`subscription_events`** - Audit trail for subscription changes
  - `id`, `subscription_id`, `event_type`, `mollie_payment_id`
  - `status`, `amount`, `metadata`, `processed_at`

### 2. Update Existing Tables
- **`tenants`** - Enhance subscription fields
  - Add `mollie_customer_id`, `subscription_expires_at`
  - Update `subscription_status` enum values
  - Add `payment_failed_count`, `grace_period_end`

## 🔧 Backend Implementation

### 1. Environment Configuration
```env
MOLLIE_API_KEY=test_xxx (your test key)
MOLLIE_WEBHOOK_SECRET=generated_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Mollie Service (`lib/services/mollieService.ts`)
- Customer management (create, get, update)  
- Subscription lifecycle (create, cancel, reactivate)
- Webhook signature verification
- Payment status handling
- Error handling with retry logic

### 3. API Routes
- **`/api/mollie/create-subscription`** - Initialize subscription flow
- **`/api/mollie/webhook`** - Handle Mollie webhooks  
- **`/api/mollie/cancel-subscription`** - Cancel subscription
- **`/api/mollie/update-payment-method`** - Update payment details
- **`/api/subscription/status`** - Get current subscription status

### 4. Database Hooks
- **`useSubscription(tenantId)`** - Manage subscription state
- **`useMollieIntegration()`** - Handle Mollie API calls
- **Subscription status middleware** - Block access for inactive accounts

## 🎨 Frontend Integration

### 1. Enhanced Subscription Page (`/admin/subscription`)
- **Active State**: Show current plan, next billing, cancel option
- **Inactive State**: Prominent upgrade button with Mollie checkout
- **Failed Payment State**: Retry payment flow
- **Cancelled State**: Reactivation option

### 2. Access Control Integration  
- **Admin Dashboard**: Subscription status warnings
- **Navigation**: Disable features for inactive subscriptions
- **Middleware**: Redirect to billing for expired accounts
- **Grace Period**: 7-day access after payment failure

### 3. User Experience Flow
1. **First-time Setup**: After tenant creation → redirect to subscription
2. **Payment Success**: Email confirmation + dashboard access
3. **Payment Failed**: Grace period + retry options
4. **Cancellation**: Confirmation modal + access until period end

## 🔄 Payment Flow Implementation

### 1. New Subscription Flow
```typescript
1. User clicks "Start Nu - €79/maand"
2. API creates Mollie customer + subscription  
3. Redirect to Mollie checkout URL
4. User completes payment
5. Mollie webhook confirms payment
6. Update tenant subscription_status = 'active'
7. Redirect to dashboard with success message
```

### 2. Webhook Processing
```typescript
1. Receive Mollie webhook POST
2. Verify webhook signature
3. Fetch full payment/subscription details
4. Update database based on status
5. Trigger relevant actions (emails, access updates)
6. Return 200 OK response
```

### 3. Recurring Payment Handling
- **Success**: Update next billing date, send receipt
- **Failed**: Increment failure count, send reminder email
- **Multiple Failures**: Suspend access, enter grace period
- **Cancellation**: Process cancellation, set access end date

## 🔒 Security & Compliance

### 1. Data Protection
- Store minimal payment data (only IDs, no card details)
- Encrypt sensitive webhook data
- Implement proper CORS for webhook endpoint
- Use HTTPS for all payment-related endpoints

### 2. Access Control
- Validate tenant ownership before subscription actions
- Rate limiting on subscription API endpoints  
- Webhook signature verification for security
- Admin-only access to subscription management

## 📊 Monitoring & Analytics

### 1. Subscription Metrics
- **Dashboard Cards**: MRR, active subscriptions, churn rate
- **Admin Analytics**: Payment success rates, cancellation reasons
- **Email Notifications**: Payment failures, subscription changes

### 2. Error Handling
- **Failed Webhooks**: Retry mechanism with exponential backoff
- **API Failures**: Graceful degradation and user messaging
- **Payment Issues**: Clear user guidance and support contact

## 🎯 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Database schema migration
- Mollie service implementation  
- Basic webhook handling
- Environment configuration

### Phase 2: Subscription Flow (Week 2)  
- Create subscription API endpoint
- Enhanced subscription page UI
- Payment success/failure handling
- Basic access control integration

### Phase 3: Management Features (Week 3)
- Cancel/reactivate subscriptions
- Payment method updates
- Grace period implementation
- Email notifications

### Phase 4: Polish & Testing (Week 4)
- Error handling improvements
- User experience refinements
- Comprehensive testing with Mollie test API
- Documentation and monitoring setup

## ✅ Success Criteria
- ✅ Users can subscribe to €79/month plan via Mollie
- ✅ Recurring payments processed automatically  
- ✅ Real-time subscription status updates via webhooks
- ✅ Graceful handling of payment failures
- ✅ Admin can monitor subscription health
- ✅ Secure and compliant payment processing
- ✅ Smooth user experience from signup to cancellation

This plan provides a complete Mollie integration that handles the full subscription lifecycle while maintaining security and providing excellent user experience.