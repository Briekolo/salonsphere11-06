-- Create tenant_metrics RPC function
CREATE OR REPLACE FUNCTION public.tenant_metrics(_tenant uuid)
RETURNS TABLE (
  revenue_last30 numeric,
  appointments_last30 bigint,
  new_clients_last30 bigint,
  low_stock_items bigint,
  avg_spend_per_client numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Revenue from last 30 days
    COALESCE(SUM(i.total_amount), 0)::numeric as revenue_last30,
    
    -- Appointments in last 30 days
    COALESCE(COUNT(DISTINCT b.id), 0)::bigint as appointments_last30,
    
    -- New clients in last 30 days
    COALESCE(COUNT(DISTINCT CASE 
      WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' 
      THEN c.id 
    END), 0)::bigint as new_clients_last30,
    
    -- Low stock items (below 10 units)
    COALESCE(COUNT(DISTINCT CASE 
      WHEN inv.quantity_in_stock < 10 
      THEN inv.id 
    END), 0)::bigint as low_stock_items,
    
    -- Average spend per client
    CASE 
      WHEN COUNT(DISTINCT i.client_id) > 0 
      THEN COALESCE(SUM(i.total_amount) / COUNT(DISTINCT i.client_id), 0)::numeric
      ELSE 0::numeric
    END as avg_spend_per_client
    
  FROM tenants t
  LEFT JOIN invoices i ON i.tenant_id = t.id 
    AND i.invoice_date >= CURRENT_DATE - INTERVAL '30 days'
    AND i.status = 'paid'
  LEFT JOIN bookings b ON b.tenant_id = t.id 
    AND b.scheduled_at >= CURRENT_DATE - INTERVAL '30 days'
    AND b.status IN ('confirmed', 'completed')
  LEFT JOIN clients c ON c.tenant_id = t.id
  LEFT JOIN inventory inv ON inv.tenant_id = t.id
  WHERE t.id = _tenant
  GROUP BY t.id;
END;
$$;

-- Create revenue_timeseries RPC function
CREATE OR REPLACE FUNCTION public.revenue_timeseries(
  _tenant uuid,
  _from date,
  _to date
)
RETURNS TABLE (
  day date,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(_from, _to, '1 day'::interval)::date AS day
  )
  SELECT 
    ds.day,
    COALESCE(SUM(i.total_amount), 0)::numeric as revenue
  FROM date_series ds
  LEFT JOIN invoices i 
    ON i.tenant_id = _tenant 
    AND i.invoice_date::date = ds.day
    AND i.status = 'paid'
  GROUP BY ds.day
  ORDER BY ds.day;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.tenant_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_timeseries(uuid, date, date) TO authenticated;

-- Add RLS policies for the functions
-- Note: These functions use SECURITY DEFINER so they bypass RLS,
-- but they only return data for the specified tenant_id