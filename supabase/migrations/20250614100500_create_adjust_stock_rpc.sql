CREATE OR REPLACE FUNCTION public.adjust_inventory_and_log(
  p_product_id UUID,
  p_tenant_id UUID,
  p_adjustment INTEGER,
  p_reason TEXT
)
RETURNS SETOF inventory_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  new_stock_level INTEGER;
BEGIN
  -- Ensure function uses the expected schema search path
  PERFORM set_config('search_path', 'public', TRUE);
  -- Update stock level and get the new value
  UPDATE public.inventory_items
  SET current_stock = GREATEST(0, current_stock + p_adjustment)
  WHERE id = p_product_id AND tenant_id = p_tenant_id
  RETURNING current_stock INTO new_stock_level;

  -- Wanneer er geen rij werd bijgewerkt (id/tenant niet gevonden)
  IF new_stock_level IS NULL THEN
    RAISE EXCEPTION 'Product % met tenant % niet gevonden', p_product_id, p_tenant_id;
  END IF;

  -- Insert into history
  INSERT INTO public.product_history (product_id, tenant_id, user_id, change, reason)
  VALUES (p_product_id, p_tenant_id, current_user_id, p_adjustment, p_reason);

  -- Return the updated item
  RETURN QUERY
  SELECT * FROM public.inventory_items WHERE id = p_product_id;
END;
$$; 