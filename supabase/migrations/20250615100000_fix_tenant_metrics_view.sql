-- Fix tenant_metrics view (valid SQL) & recreate RPC
-- Datum: 2025-06-15 10:00

-- 1) Drop oude view/function indien aanwezig
DROP VIEW IF EXISTS public.tenant_metrics_view CASCADE;
DROP FUNCTION IF EXISTS public.tenant_metrics(uuid) CASCADE;

-- 2) Nieuwe view
CREATE OR REPLACE VIEW public.tenant_metrics_view
WITH (security_barrier = TRUE) AS
SELECT
  t.id AS tenant_id,
  -- Totale betaalde omzet laatste 30 dagen
  COALESCE(
    (
      SELECT SUM(p.amount)
      FROM payments p
      WHERE p.tenant_id = t.id
        AND p.status = 'paid'
        AND p.created_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS revenue_last30,

  -- Aantal afspraken laatste 30 dagen
  COALESCE(
    (
      SELECT COUNT(*)
      FROM bookings b
      WHERE b.tenant_id = t.id
        AND b.scheduled_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS appointments_last30,

  -- Nieuwe klanten laatste 30 dagen
  COALESCE(
    (
      SELECT COUNT(*)
      FROM clients c
      WHERE c.tenant_id = t.id
        AND c.created_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS new_clients_last30,

  -- Lage voorraad items (current_stock <= min_stock)
  COALESCE(
    (
      SELECT COUNT(*)
      FROM inventory_items ii
      WHERE ii.tenant_id = t.id
        AND ii.current_stock <= ii.min_stock
    ), 0
  ) AS low_stock_items,

  -- Gemiddelde besteding per client (betaalde omzet / unieke klanten) laatste 30 dagen
  COALESCE(
    (
      SELECT ROUND(SUM(p.amount)::numeric / NULLIF(COUNT(DISTINCT b.client_id), 0), 2)
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE p.tenant_id = t.id
        AND p.status = 'paid'
        AND p.created_at > NOW() - INTERVAL '30 days'
    ), 0
  ) AS avg_spend_per_client
FROM tenants t;

-- 3) RPC functie
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

-- 4) Rechten
GRANT EXECUTE ON FUNCTION public.tenant_metrics(uuid) TO authenticated, service_role, anon; 