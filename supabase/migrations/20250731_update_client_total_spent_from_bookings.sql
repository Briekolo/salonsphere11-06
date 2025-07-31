-- Update client total_spent to calculate from paid bookings instead of invoices
-- Date: 2025-07-31

-- Function to update a single client's total_spent
CREATE OR REPLACE FUNCTION update_client_total_spent(client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clients c
  SET total_spent = COALESCE(
    (
      SELECT SUM(s.price)
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.client_id = c.id
        AND b.is_paid = true
        AND b.tenant_id = c.tenant_id
    ), 0
  )
  WHERE c.id = client_id;
END;
$$;

-- Function to update all clients' total_spent for a tenant
CREATE OR REPLACE FUNCTION update_all_clients_total_spent(tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clients c
  SET total_spent = COALESCE(
    (
      SELECT SUM(s.price)
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.client_id = c.id
        AND b.is_paid = true
        AND b.tenant_id = c.tenant_id
    ), 0
  )
  WHERE c.tenant_id = tenant_id;
END;
$$;

-- Trigger to update client total_spent when a booking is paid
CREATE OR REPLACE FUNCTION update_client_spent_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If payment status changed or booking was inserted/deleted
  IF (TG_OP = 'INSERT' AND NEW.is_paid = true) OR
     (TG_OP = 'UPDATE' AND OLD.is_paid IS DISTINCT FROM NEW.is_paid) OR
     (TG_OP = 'DELETE' AND OLD.is_paid = true) THEN
    
    -- Update the client's total spent
    IF TG_OP = 'DELETE' THEN
      PERFORM update_client_total_spent(OLD.client_id);
    ELSE
      PERFORM update_client_total_spent(NEW.client_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS update_client_spent_trigger ON bookings;
CREATE TRIGGER update_client_spent_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_client_spent_on_booking_change();

-- Update all existing client total_spent values
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT DISTINCT tenant_id FROM clients
  LOOP
    PERFORM update_all_clients_total_spent(tenant_record.tenant_id);
  END LOOP;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_client_total_spent(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_all_clients_total_spent(UUID) TO authenticated, service_role;