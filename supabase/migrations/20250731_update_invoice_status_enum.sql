-- Update invoice_status enum to use 'pending' instead of 'draft' for a more professional workflow
-- This makes the system more aligned with real-world business practices

-- First, we need to add the new status to the enum
ALTER TYPE invoice_status ADD VALUE 'pending' BEFORE 'sent';

-- Update all existing 'draft' invoices to 'pending'
UPDATE invoices 
SET status = 'pending'::invoice_status 
WHERE status = 'draft';

-- Now we need to recreate the enum without 'draft'
-- PostgreSQL doesn't allow removing values from enums, so we need to:
-- 1. Create a new enum type
-- 2. Update all columns to use the new type
-- 3. Drop the old type
-- 4. Rename the new type

-- Create new enum type
CREATE TYPE invoice_status_new AS ENUM (
  'pending',
  'sent', 
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);

-- Update the column to use the new enum
ALTER TABLE invoices 
  ALTER COLUMN status TYPE invoice_status_new 
  USING status::text::invoice_status_new;

-- Update any functions that return the old enum type
-- First, the update_invoice_payment_status function
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10, 2);
  v_total_amount DECIMAL(10, 2);
  v_new_status invoice_status_new;
BEGIN
  -- Get total paid amount
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Get invoice total
  SELECT total_amount INTO v_total_amount
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Determine new status
  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    -- Keep current status if no payments
    SELECT status INTO v_new_status
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  -- Update invoice
  UPDATE invoices
  SET 
    paid_amount = v_total_paid,
    status = v_new_status,
    paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the create_invoice_on_payment_confirmed function
CREATE OR REPLACE FUNCTION create_invoice_on_payment_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_service RECORD;
  v_invoice_id uuid;
  v_invoice_number text;
  v_today date;
BEGIN
  -- Only proceed if is_paid changed from FALSE to TRUE
  -- and payment_confirmed_at is being set
  IF NEW.is_paid = TRUE AND 
     (OLD.is_paid IS NULL OR OLD.is_paid = FALSE) AND
     NEW.payment_confirmed_at IS NOT NULL THEN
    
    -- Check if invoice already exists for this booking
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE booking_id = NEW.id) THEN
      -- Get service details
      SELECT * INTO v_service FROM services WHERE id = NEW.service_id;
      
      -- Only create invoice if service exists and has a price
      IF v_service.id IS NOT NULL AND v_service.price IS NOT NULL THEN
        -- Generate invoice number
        v_invoice_number := generate_invoice_number(NEW.tenant_id);
        
        -- Get today's date
        v_today := CURRENT_DATE;
        
        -- Create invoice with correct columns
        INSERT INTO invoices (
          tenant_id,
          client_id,
          booking_id,
          invoice_number,
          issue_date,
          due_date,
          status,
          subtotal,
          tax_rate,
          tax_amount,
          discount_amount,
          total_amount,
          paid_amount,
          notes
        ) VALUES (
          NEW.tenant_id,
          NEW.client_id,
          NEW.id,
          v_invoice_number,
          v_today,
          v_today, -- Due immediately for auto-generated invoices
          'pending'::invoice_status_new, -- Use pending instead of draft
          v_service.price,
          21.00, -- Dutch BTW
          v_service.price * 0.21,
          0,
          v_service.price * 1.21,
          0,
          'Automatisch gegenereerd bij betalingsbevestiging. Betaalmethode: ' || COALESCE(NEW.payment_method, 'Onbekend')
        ) RETURNING id INTO v_invoice_id;
        
        -- Add invoice item
        INSERT INTO invoice_items (
          invoice_id,
          service_id,
          description,
          quantity,
          unit_price,
          total_price,
          sort_order
        ) VALUES (
          v_invoice_id,
          NEW.service_id,
          v_service.name,
          1,
          v_service.price,
          v_service.price,
          0
        );
        
        -- If the booking is already paid, immediately mark invoice as paid
        INSERT INTO invoice_payments (
          invoice_id,
          amount,
          payment_method,
          payment_date,
          notes,
          created_by
        ) VALUES (
          v_invoice_id,
          v_service.price * 1.21, -- Include tax
          COALESCE(NEW.payment_method, 'cash'),
          v_today,
          'Automatische betaling bij afspraak',
          auth.uid()
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old enum type
DROP TYPE invoice_status;

-- Rename the new enum type
ALTER TYPE invoice_status_new RENAME TO invoice_status;

-- Update default status in invoices table (if there's a default constraint)
-- First drop any existing default constraint
ALTER TABLE invoices ALTER COLUMN status DROP DEFAULT;
-- Then add the new default
ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'pending'::invoice_status;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Invoice status enum updated: "draft" replaced with "pending"';
  RAISE NOTICE 'All existing draft invoices have been migrated to pending status';
END $$;