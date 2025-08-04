-- Add notification_preferences column to tenants table
-- This enables storing email/SMS notification settings per tenant

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": {
    "new_bookings": true,
    "cancellations": true,
    "reminders": true,
    "daily_summary": false,
    "payment_received": true,
    "low_inventory": true
  },
  "sms": {
    "enabled": false,
    "new_bookings": false,
    "reminders": false,
    "cancellations": false
  },
  "staff": {
    "new_bookings": true,
    "cancellations": true,
    "no_shows": true,
    "schedule_changes": true
  },
  "client_reminders": {
    "appointment_reminder_hours": 24,
    "send_confirmation_email": true,
    "send_thank_you_email": false
  }
}';

-- Update existing tenants that don't have notification preferences
UPDATE tenants 
SET notification_preferences = '{
  "email": {
    "new_bookings": true,
    "cancellations": true,
    "reminders": true,
    "daily_summary": false,
    "payment_received": true,
    "low_inventory": true
  },
  "sms": {
    "enabled": false,
    "new_bookings": false,
    "reminders": false,
    "cancellations": false
  },
  "staff": {
    "new_bookings": true,
    "cancellations": true,
    "no_shows": true,
    "schedule_changes": true
  },
  "client_reminders": {
    "appointment_reminder_hours": 24,
    "send_confirmation_email": true,
    "send_thank_you_email": false
  }
}'
WHERE notification_preferences IS NULL;

-- Add a check constraint to ensure notification_preferences is not null
ALTER TABLE tenants 
ADD CONSTRAINT notification_preferences_not_null 
CHECK (notification_preferences IS NOT NULL);

-- Create an index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_tenants_notification_preferences 
ON tenants USING GIN (notification_preferences);

-- Add comment for documentation
COMMENT ON COLUMN tenants.notification_preferences IS 'JSONB object storing email, SMS, and staff notification preferences for the tenant';