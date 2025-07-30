-- Fix average transaction value calculation to include both invoices and direct paid bookings
-- Date: 2025-07-30
-- Issue: Average transaction value shows 0 when appointments are marked as paid without creating invoices

-- Drop existing view and function to recreate with fixed calculation
DROP VIEW IF EXISTS public.tenant_metrics_view CASCADE;
DROP FUNCTION IF EXISTS public.tenant_metrics(uuid) CASCADE;

-- Create updated view with comprehensive average transaction value calculation
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

  -- Expected revenue current month (includes both paid and unpaid)
  COALESCE(
    (
      SELECT SUM(
        CASE 
          -- If there's a paid invoice, use its total amount
          WHEN i.id IS NOT NULL AND i.status = 'paid' THEN i.total_amount
          -- Otherwise use the service price
          ELSE s.price
        END
      )
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      LEFT JOIN invoices i ON i.booking_id = b.id
      WHERE b.tenant_id = t.id
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
  ) AS avg_spend_per_client,

  -- FIXED: Average transaction value from both invoices AND direct paid bookings
  COALESCE(
    (
      WITH all_transactions AS (
        -- Get paid invoices
        SELECT 
          i.total_amount as amount,
          i.paid_at as transaction_date
        FROM invoices i
        WHERE i.tenant_id = t.id
          AND i.status = 'paid'
          AND i.paid_at IS NOT NULL
          AND i.paid_at > NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        -- Get paid bookings without invoices
        SELECT 
          s.price as amount,
          COALESCE(b.payment_confirmed_at, b.updated_at) as transaction_date
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        LEFT JOIN invoices i ON i.booking_id = b.id
        WHERE b.tenant_id = t.id
          AND b.is_paid = true
          AND i.id IS NULL  -- Only bookings without invoices
          AND b.scheduled_at > NOW() - INTERVAL '30 days'
      )
      SELECT ROUND(AVG(amount)::numeric, 2)
      FROM all_transactions
      WHERE amount > 0
    ), 0
  ) AS avg_transaction_value
FROM tenants t;

-- Recreate RPC function with updated return type
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

-- Add comment explaining the comprehensive calculation
COMMENT ON VIEW public.tenant_metrics_view IS 'Dashboard metrics view with comprehensive calculations:
- avg_transaction_value: Calculates average from BOTH:
  1. Paid invoices (with paid_at timestamp)
  2. Paid bookings without invoices (is_paid=true)
  This ensures all payment methods are included in the average';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Average transaction value calculation updated to include both invoice and direct booking payments';
END $$;