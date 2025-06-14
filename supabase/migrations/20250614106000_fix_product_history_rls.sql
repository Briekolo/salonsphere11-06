-- Drop de oude select-policy en maak een nieuwe die tenant_id() helper gebruikt

ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read their own tenant history" ON public.product_history;

CREATE POLICY "Read product_history binnen eigen tenant"
  ON public.product_history
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.tenant_id()); 