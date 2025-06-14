ALTER TABLE "public"."services"
ADD COLUMN "products_used" TEXT[] DEFAULT '{}',
ADD COLUMN "certifications" TEXT[] DEFAULT '{}'; 