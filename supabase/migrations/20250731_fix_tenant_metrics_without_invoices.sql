-- Fix tenant_metrics to work without invoices table
-- Date: 2025-07-31

-- Drop existing view and function
DROP VIEW IF EXISTS public.tenant_metrics_view CASCADE;
DROP FUNCTION IF EXISTS public.tenant_metrics(uuid) CASCADE;

-- Create updated view that calculates revenue from bookings instead of invoices
CREATE OR REPLACE VIEW public.tenant_metrics_view
WITH (security_barrier = TRUE) AS
SELECT
  t.id AS tenant_id,
  -- Total revenue last 30 days from paid bookings
  COALESCE(
    (
      SELECT SUM(s.price)
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.tenant_id = t.id
        AND b.is_paid = true
        AND b.scheduled_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS revenue_last30,

  -- Number of appointments last 30 days
  COALESCE(
    (
      SELECT COUNT(*)
      FROM bookings b
      WHERE b.tenant_id = t.id
        AND b.scheduled_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS appointments_last30,

  -- New clients last 30 days
  COALESCE(
    (
      SELECT COUNT(*)
      FROM clients c
      WHERE c.tenant_id = t.id
        AND c.created_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS new_clients_last30,

  -- Low stock items (current_stock <= min_stock)
  COALESCE(
    (
      SELECT COUNT(*)
      FROM inventory_items ii
      WHERE ii.tenant_id = t.id
        AND ii.current_stock <= ii.min_stock
    ), 0
  ) AS low_stock_items,

  -- Expected revenue current month from unpaid bookings
  COALESCE(
    (
      SELECT SUM(s.price)
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.tenant_id = t.id
        AND b.is_paid = false
        AND b.scheduled_at >= DATE_TRUNC('month', NOW())
        AND b.scheduled_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    ), 0
  ) AS expected_revenue_current_month,

  -- Average spend per client (total revenue / unique clients with paid bookings) last 30 days
  COALESCE(
    (
      SELECT 
        CASE 
          WHEN COUNT(DISTINCT b.client_id) > 0 
          THEN ROUND(SUM(s.price)::numeric / COUNT(DISTINCT b.client_id), 2)
          ELSE 0
        END
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.tenant_id = t.id
        AND b.is_paid = true
        AND b.scheduled_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS avg_spend_per_client,

  -- Average transaction value (paid bookings) last 30 days
  COALESCE(
    (
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND(SUM(s.price)::numeric / COUNT(*), 2)
          ELSE 0
        END
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.tenant_id = t.id
        AND b.is_paid = true
        AND b.scheduled_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS avg_transaction_value
FROM tenants t;

-- Recreate RPC function
CREATE OR REPLACE FUNCTION public.tenant_metrics(_tenant uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT row_to_json(tm.*)::jsonb
  FROM public.tenant_metrics_view tm
  WHERE tm.tenant_id = _tenant;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.tenant_metrics(uuid) TO authenticated, service_role, anon;

-- Add indexes for better performance on booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_paid_scheduled 
ON bookings(tenant_id, is_paid, scheduled_at) 
WHERE is_paid = true;

CREATE INDEX IF NOT EXISTS idx_bookings_unpaid_scheduled 
ON bookings(tenant_id, is_paid, scheduled_at) 
WHERE is_paid = false;