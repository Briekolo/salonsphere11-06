-- Update client total_spent to calculate from paid bookings instead of invoices
-- Date: 2025-07-31

-- Function to update a single client's total_spent
CREATE OR REPLACE FUNCTION update_client_total_spent(p_client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total DECIMAL(10,2);
  v_count INTEGER;
BEGIN
  -- Calculate total with explicit type casting and debugging
  SELECT 
    COALESCE(SUM(s.price::numeric), 0)::decimal(10,2),
    COUNT(*)
  INTO v_total, v_count
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.client_id = p_client_id
    AND b.is_paid = true
    AND s.price IS NOT NULL
    AND s.price > 0;

  -- Log for debugging
  RAISE NOTICE 'Updating client % - found % paid bookings, total: %', p_client_id, v_count, v_total;

  -- Update the client record
  UPDATE clients c
  SET total_spent = v_total
  WHERE c.id = p_client_id;
END;
$$;

-- Function to update all clients' total_spent for a tenant
CREATE OR REPLACE FUNCTION update_all_clients_total_spent(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- Update all clients for the tenant with explicit type casting
  UPDATE clients c
  SET total_spent = COALESCE(
    (
      SELECT SUM(s.price::numeric)::decimal(10,2)
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.client_id = c.id
        AND b.is_paid = true
        AND b.tenant_id = c.tenant_id
        AND s.price IS NOT NULL
        AND s.price > 0
    ), 0
  )
  WHERE c.tenant_id = p_tenant_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % clients for tenant %', v_updated, p_tenant_id;
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

-- Manual recalculation function for debugging
CREATE OR REPLACE FUNCTION recalculate_all_client_totals()
RETURNS TABLE (
  tenant_id UUID,
  clients_updated INTEGER,
  total_revenue DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_record RECORD;
  v_clients_updated INTEGER;
  v_total_revenue DECIMAL(10,2);
BEGIN
  -- Process each tenant
  FOR tenant_record IN SELECT DISTINCT t.id FROM tenants t
  LOOP
    -- Update all clients for this tenant
    PERFORM update_all_clients_total_spent(tenant_record.id);
    
    -- Get statistics
    SELECT 
      COUNT(DISTINCT c.id),
      COALESCE(SUM(c.total_spent), 0)
    INTO v_clients_updated, v_total_revenue
    FROM clients c
    WHERE c.tenant_id = tenant_record.id
      AND c.total_spent > 0;
    
    RETURN QUERY SELECT tenant_record.id, v_clients_updated, v_total_revenue;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION recalculate_all_client_totals() TO authenticated, service_role;

-- Verification query to check booking data
CREATE OR REPLACE FUNCTION verify_booking_data()
RETURNS TABLE (
  check_name TEXT,
  result_count INTEGER,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check 1: Bookings with null service_id
  RETURN QUERY
  SELECT 
    'Bookings with null service_id'::TEXT,
    COUNT(*)::INTEGER,
    'These bookings cannot calculate revenue'::TEXT
  FROM bookings
  WHERE service_id IS NULL;

  -- Check 2: Services with null or zero price
  RETURN QUERY
  SELECT 
    'Services with null or zero price'::TEXT,
    COUNT(*)::INTEGER,
    'These services will not contribute to revenue'::TEXT
  FROM services
  WHERE price IS NULL OR price <= 0;

  -- Check 3: Paid bookings count by tenant
  RETURN QUERY
  SELECT 
    'Total paid bookings'::TEXT,
    COUNT(*)::INTEGER,
    'Bookings marked as paid'::TEXT
  FROM bookings
  WHERE is_paid = true;

  -- Check 4: Bookings with valid service prices
  RETURN QUERY
  SELECT 
    'Paid bookings with valid prices'::TEXT,
    COUNT(*)::INTEGER,
    'These should contribute to client revenue'::TEXT
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.is_paid = true
    AND s.price IS NOT NULL
    AND s.price > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_booking_data() TO authenticated, service_role;

-- Run verification
DO $$
DECLARE
  check_record RECORD;
BEGIN
  RAISE NOTICE '=== Verifying booking data ===';
  FOR check_record IN SELECT * FROM verify_booking_data()
  LOOP
    RAISE NOTICE '% : % (%)', check_record.check_name, check_record.result_count, check_record.details;
  END LOOP;
  
  RAISE NOTICE '=== Recalculating all client totals ===';
  -- Recalculate all client totals
  FOR check_record IN SELECT * FROM recalculate_all_client_totals()
  LOOP
    RAISE NOTICE 'Tenant %: Updated % clients, total revenue: €%', 
      check_record.tenant_id, check_record.clients_updated, check_record.total_revenue;
  END LOOP;
END $$;