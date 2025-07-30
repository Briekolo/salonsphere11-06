-- Fix revenue tracking to use payment_status instead of old status field
-- Date: 2025-07-30

-- Update tenant_metrics_view to use proper payment tracking
DROP VIEW IF EXISTS public.tenant_metrics_view CASCADE;
DROP FUNCTION IF EXISTS public.tenant_metrics(uuid) CASCADE;

-- Create updated view that uses invoices with payment_status
CREATE OR REPLACE VIEW public.tenant_metrics_view
WITH (security_barrier = TRUE) AS
SELECT
  t.id AS tenant_id,
  -- Total paid revenue last 30 days from invoices
  COALESCE(
    (
      SELECT SUM(i.total_amount)
      FROM invoices i
      WHERE i.tenant_id = t.id
        AND i.status = 'paid'
        AND i.paid_at IS NOT NULL
        AND i.paid_at > NOW() - INTERVAL '30 days'
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

  -- Average spend per client (paid invoices / unique clients) last 30 days
  COALESCE(
    (
      SELECT ROUND(SUM(i.total_amount)::numeric / NULLIF(COUNT(DISTINCT b.client_id), 0), 2)
      FROM invoices i
      JOIN bookings b ON b.id = i.booking_id
      WHERE i.tenant_id = t.id
        AND i.status = 'paid'
        AND i.paid_at IS NOT NULL
        AND i.paid_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS avg_spend_per_client
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

-- Add index for better performance on invoice payment queries
CREATE INDEX IF NOT EXISTS idx_invoices_status_paid_at 
ON invoices(tenant_id, status, paid_at) 
WHERE status = 'paid' AND paid_at IS NOT NULL;

-- Add index for booking payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings(tenant_id, is_paid, scheduled_at);