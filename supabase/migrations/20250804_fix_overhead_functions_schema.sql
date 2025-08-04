-- Fix overhead functions to use correct database schema
-- Migration: 20250804_fix_overhead_functions_schema

-- Drop existing functions to recreate them with correct schema
DROP FUNCTION IF EXISTS calculate_overhead_per_treatment(UUID, DATE);
DROP FUNCTION IF EXISTS calculate_overhead_percentage(UUID, DATE);
DROP FUNCTION IF EXISTS get_overhead_metrics(UUID, DATE);

-- Recreate function to calculate overhead per treatment with correct schema
CREATE OR REPLACE FUNCTION calculate_overhead_per_treatment(
  tenant_id_param UUID,
  month_year DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  overhead_per_treatment DECIMAL,
  total_treatments INTEGER,
  overhead_monthly DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  monthly_overhead DECIMAL := 0;
  treatment_count INTEGER := 0;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Calculate start and end of the month
  start_date := DATE_TRUNC('month', month_year);
  end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Get tenant's monthly overhead
  SELECT t.overhead_monthly INTO monthly_overhead
  FROM tenants t 
  WHERE t.id = tenant_id_param;
  
  IF monthly_overhead IS NULL THEN
    monthly_overhead := 0;
  END IF;
  
  -- Count treatments in the specified month
  -- Count paid bookings or past bookings as completed treatments
  SELECT COUNT(*) INTO treatment_count
  FROM bookings b
  WHERE b.tenant_id = tenant_id_param
    AND (b.is_paid = true OR b.scheduled_at < CURRENT_TIMESTAMP)
    AND DATE(b.scheduled_at) BETWEEN start_date AND end_date;
  
  -- If no treatments, avoid division by zero
  IF treatment_count = 0 THEN
    RETURN QUERY SELECT 
      0::DECIMAL as overhead_per_treatment,
      0 as total_treatments,
      monthly_overhead as overhead_monthly;
  ELSE
    RETURN QUERY SELECT 
      (monthly_overhead / treatment_count) as overhead_per_treatment,
      treatment_count as total_treatments,
      monthly_overhead as overhead_monthly;
  END IF;
END;
$$;

-- Recreate function to calculate overhead percentage with correct schema
CREATE OR REPLACE FUNCTION calculate_overhead_percentage(
  tenant_id_param UUID,
  month_year DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  overhead_percentage DECIMAL,
  average_treatment_price DECIMAL,
  overhead_per_treatment DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_price DECIMAL := 0;
  overhead_cost DECIMAL := 0;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Calculate start and end of the month
  start_date := DATE_TRUNC('month', month_year);
  end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Get overhead per treatment
  SELECT oht.overhead_per_treatment INTO overhead_cost
  FROM calculate_overhead_per_treatment(tenant_id_param, month_year) oht;
  
  -- Calculate average treatment price from completed bookings
  -- Get price from services table via join
  SELECT COALESCE(AVG(s.price), 0) INTO avg_price
  FROM bookings b
  JOIN services s ON b.service_id = s.id
  WHERE b.tenant_id = tenant_id_param
    AND (b.is_paid = true OR b.scheduled_at < CURRENT_TIMESTAMP)
    AND DATE(b.scheduled_at) BETWEEN start_date AND end_date
    AND s.price > 0;
  
  -- Calculate percentage
  IF avg_price = 0 THEN
    RETURN QUERY SELECT 
      0::DECIMAL as overhead_percentage,
      0::DECIMAL as average_treatment_price,
      overhead_cost as overhead_per_treatment;
  ELSE
    RETURN QUERY SELECT 
      ((overhead_cost / avg_price) * 100) as overhead_percentage,
      avg_price as average_treatment_price,
      overhead_cost as overhead_per_treatment;
  END IF;
END;
$$;

-- Recreate comprehensive overhead metrics function with correct schema
CREATE OR REPLACE FUNCTION get_overhead_metrics(
  tenant_id_param UUID,
  month_year DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  overhead_monthly DECIMAL,
  total_treatments INTEGER,
  overhead_per_treatment DECIMAL,
  average_treatment_price DECIMAL,
  overhead_percentage DECIMAL,
  month_analyzed DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oht.overhead_monthly,
    oht.total_treatments,
    oht.overhead_per_treatment,
    ohp.average_treatment_price,
    ohp.overhead_percentage,
    month_year as month_analyzed
  FROM calculate_overhead_per_treatment(tenant_id_param, month_year) oht
  CROSS JOIN calculate_overhead_percentage(tenant_id_param, month_year) ohp;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_overhead_per_treatment(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_overhead_percentage(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_overhead_metrics(UUID, DATE) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_overhead_metrics(UUID, DATE) IS 'Calculate comprehensive overhead metrics for a tenant in a specific month using correct database schema';