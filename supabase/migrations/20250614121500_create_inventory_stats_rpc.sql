-- Supabase migration: create RPC get_inventory_stats
-- Beschrijving: Geeft aggregatiestatistieken over voorraad en bestellingen voor een tenant

CREATE OR REPLACE FUNCTION public.get_inventory_stats(
  _tenant uuid
)
RETURNS TABLE (
  total_products integer,
  low_stock_items integer,
  out_of_stock_items integer,
  orders_last30 integer
) AS $$
  SELECT
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE current_stock = 0) AS out_of_stock_items,
    COUNT(*) FILTER (
      WHERE current_stock <= min_stock
      AND current_stock > 0
    ) AS low_stock_items,
    (
      SELECT COUNT(*)
      FROM supplier_pos sp
      WHERE sp.tenant_id = _tenant
        AND sp.order_date >= (CURRENT_DATE - INTERVAL '30 days')
    ) AS orders_last30
  FROM inventory_items ii
  WHERE ii.tenant_id = _tenant;
$$ LANGUAGE sql STABLE; 