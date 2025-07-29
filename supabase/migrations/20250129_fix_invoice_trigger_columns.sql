/*
  Fix invoice trigger to use correct column names
  
  The invoices table doesn't have created_by or payment_method columns.
  This migration updates the trigger function to work with the actual table structure.
*/

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS create_invoice_on_payment_confirmed() CASCADE;

-- Recreate the function with correct column names
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
          status,
          subtotal,
          tax_rate,
          tax_amount,
          discount_amount,
          total_amount,
          paid_amount,
          issue_date,
          due_date,
          paid_at,
          notes
        ) VALUES (
          NEW.tenant_id,
          NEW.client_id,
          NEW.id,
          v_invoice_number,
          'draft'::invoice_status, -- Cast to the enum type
          v_service.price,
          21.00, -- Dutch BTW
          v_service.price * 0.21,
          0.00, -- No discount by default
          v_service.price * 1.21,
          0.00, -- Not paid yet (draft status)
          v_today,
          v_today + INTERVAL '30 days', -- 30 days payment term
          NEW.payment_confirmed_at,
          'Automatisch aangemaakt bij betalingsbevestiging. Betaalmethode: ' || COALESCE(NEW.payment_method, 'Onbekend')
        ) RETURNING id INTO v_invoice_id;
        
        -- Create invoice item
        INSERT INTO invoice_items (
          invoice_id,
          service_id,
          description,
          quantity,
          unit_price,
          total_price
        ) VALUES (
          v_invoice_id,
          NEW.service_id,
          v_service.name,
          1,
          v_service.price,
          v_service.price
        );
        
        RAISE NOTICE 'Invoice % created for booking %', v_invoice_number, NEW.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_invoice_on_payment_trigger ON bookings;
CREATE TRIGGER create_invoice_on_payment_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_on_payment_confirmed();

-- Update the comment
COMMENT ON FUNCTION create_invoice_on_payment_confirmed() IS 'Creates an invoice when a booking payment is confirmed - fixed version with correct columns';

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Invoice trigger fixed to use correct column names';
    RAISE NOTICE 'Payment method is now stored in the notes field';
END $$;