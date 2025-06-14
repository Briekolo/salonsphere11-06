CREATE TABLE "public"."product_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE,
  "tenant_id" UUID NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "change" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for product_history
ALTER TABLE "public"."product_history" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read their own tenant history"
ON "public"."product_history"
FOR SELECT
TO authenticated
USING ((SELECT tenant_id FROM public.users WHERE auth.uid() = id) = tenant_id);

-- Indexes for performance
CREATE INDEX "idx_product_history_product_id" ON "public"."product_history"("product_id");
CREATE INDEX "idx_product_history_tenant_id" ON "public"."product_history"("tenant_id"); 