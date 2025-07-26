-- Add additional profile fields to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Nederland',
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS chamber_of_commerce text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for salon assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for salon-assets bucket
CREATE POLICY "Tenants can upload their own assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'salon-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Tenants can update their own assets" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'salon-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'salon-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Tenants can delete their own assets" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'salon-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view all assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'salon-assets');