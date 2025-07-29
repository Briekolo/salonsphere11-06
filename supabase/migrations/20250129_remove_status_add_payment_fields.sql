/*
  Remove appointment status system and add payment confirmation fields
  
  Changes:
  1. Remove status column from bookings table
  2. Add payment confirmation fields:
     - is_paid: boolean (defaults to false - "not paid yet")
     - payment_confirmed_at: timestamp when payment was confirmed
     - payment_method: how the payment was made
*/

-- Add new payment fields first
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method text NULL;

-- Set all existing bookings to unpaid (default state)
UPDATE bookings SET is_paid = false WHERE is_paid IS NULL;

-- Remove the status column and its constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings DROP COLUMN IF EXISTS status;

-- Add check constraint for payment_method
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_method_check 
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'bank_transfer', 'sepa', 'other'));

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(tenant_id, is_paid);

-- Update the updated_at timestamp for all modified records
UPDATE bookings SET updated_at = now() WHERE updated_at < now();