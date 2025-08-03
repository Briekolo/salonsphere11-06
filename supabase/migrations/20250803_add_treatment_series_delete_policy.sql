-- Add missing DELETE policy for treatment_series table
-- This enables users to delete treatment series records for their own tenant

-- Allow users to delete treatment series for their tenant
CREATE POLICY "Users can delete treatment series for their tenant" ON treatment_series
  FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Add comment for documentation
COMMENT ON POLICY "Users can delete treatment series for their tenant" ON treatment_series IS 'Allows users to delete treatment series records within their own tenant scope';