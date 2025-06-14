ALTER TABLE "public"."services"
ADD COLUMN IF NOT EXISTS "products_used" TEXT[] DEFAULT '{}'::text[] NOT NULL,
ADD COLUMN IF NOT EXISTS "certifications" TEXT[] DEFAULT '{}'::text[] NOT NULL; 