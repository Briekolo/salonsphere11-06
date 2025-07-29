/*
  Reintegrate booking triggers using payment-based workflow
  
  This migration recreates the invoice creation and session tracking triggers
  that were removed earlier, but now based on payment confirmation instead
  of status changes.
  
  Triggers:
  1. Create invoice when payment is confirmed
  2. Track treatment sessions when payment is confirmed
*/

-- Function to create invoice when payment is confirmed
CREATE OR REPLACE FUNCTION create_invoice_on_payment_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_service RECORD;
  v_invoice_id uuid;
  v_invoice_number text;
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
        
        -- Create invoice
        INSERT INTO invoices (
          tenant_id,
          client_id,
          booking_id,
          invoice_number,
          status,
          subtotal,
          tax_rate,
          tax_amount,
          total_amount,
          created_by,
          payment_method,
          paid_at
        ) VALUES (
          NEW.tenant_id,
          NEW.client_id,
          NEW.id,
          v_invoice_number,
          'draft', -- Start as draft, can be auto-sent later
          v_service.price,
          21.00, -- Dutch BTW
          v_service.price * 0.21,
          v_service.price * 1.21,
          NEW.staff_id,
          NEW.payment_method,
          NEW.payment_confirmed_at
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

-- Function to handle treatment session tracking when payment is confirmed
CREATE OR REPLACE FUNCTION handle_behandeling_sessie_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_aantal_sessies INT;
    v_traject_id UUID;
BEGIN
    -- Only proceed if is_paid changed from FALSE to TRUE
    IF NEW.is_paid = TRUE AND 
       (OLD.is_paid IS NULL OR OLD.is_paid = FALSE) THEN
        
        -- Get the number of sessions for the service
        SELECT aantal_sessies INTO v_aantal_sessies
        FROM services
        WHERE id = NEW.service_id;

        -- If the service has more than one session, it's a "traject"
        IF v_aantal_sessies > 1 THEN
            -- Check if a traject already exists for this client and service
            SELECT id INTO v_traject_id
            FROM klant_behandeling_trajecten
            WHERE klant_id = NEW.client_id 
            AND behandeling_id = NEW.service_id
            AND tenant_id = NEW.tenant_id;

            IF v_traject_id IS NULL THEN
                -- No traject exists, create a new one
                INSERT INTO klant_behandeling_trajecten (
                    klant_id, 
                    behandeling_id, 
                    totaal_sessies, 
                    voltooide_sessies, 
                    tenant_id,
                    start_datum
                )
                VALUES (
                    NEW.client_id, 
                    NEW.service_id, 
                    v_aantal_sessies, 
                    1, 
                    NEW.tenant_id,
                    CURRENT_TIMESTAMP
                );
                
                RAISE NOTICE 'New treatment trajectory created for client % service %', NEW.client_id, NEW.service_id;
            ELSE
                -- Traject exists, increment the completed sessions count
                UPDATE klant_behandeling_trajecten
                SET voltooide_sessies = voltooide_sessies + 1,
                    laatste_update = CURRENT_TIMESTAMP
                WHERE id = v_traject_id
                -- Prevent going over the total sessions
                AND voltooide_sessies < totaal_sessies;
                
                RAISE NOTICE 'Treatment trajectory updated for client % service %', NEW.client_id, NEW.service_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice creation on payment confirmation
DROP TRIGGER IF EXISTS create_invoice_on_payment_trigger ON bookings;
CREATE TRIGGER create_invoice_on_payment_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_on_payment_confirmed();

-- Create trigger for session tracking on payment confirmation
DROP TRIGGER IF EXISTS track_session_on_payment_trigger ON bookings;
CREATE TRIGGER track_session_on_payment_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_behandeling_sessie_on_payment();

-- Add helpful comments
COMMENT ON FUNCTION create_invoice_on_payment_confirmed() IS 'Creates an invoice when a booking payment is confirmed';
COMMENT ON FUNCTION handle_behandeling_sessie_on_payment() IS 'Tracks treatment sessions for multi-session services when payment is confirmed';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Payment-based triggers successfully created';
    RAISE NOTICE 'Invoices will be created when is_paid = TRUE and payment_confirmed_at is set';
    RAISE NOTICE 'Treatment sessions will be tracked when payment is confirmed';
END $$;