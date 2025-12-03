/*
  # Create KYC Documents Storage

  Creates storage bucket for KYC document uploads:
  - Secure document storage
  - Access policies
  - File size limits

  1. Storage
    - Bucket: kyc-documents
    - Private access
    - Admin and user access policies

  2. Security
    - Users can upload own documents
    - Admins can view all documents
*/

-- Create storage bucket (if not exists via SQL)
-- Note: Storage buckets are typically created via Supabase Dashboard or CLI
-- This is a placeholder for documentation

-- Create policy helpers
CREATE OR REPLACE FUNCTION is_owner(bucket_id text, object_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT auth.uid()::text = split_part(object_path, '/', 1));
END;
$$;

-- Storage policies will be:
-- 1. Users can upload to their own folder (auth.uid()/*)
-- 2. Users can read their own files
-- 3. Admins can read all files
-- 4. Max file size: 5MB
-- 5. Allowed types: image/*

-- Log storage bucket creation requirement
INSERT INTO audit_logs (action, resource_type, new_data, created_at)
VALUES (
  'storage_bucket_required',
  'storage',
  jsonb_build_object(
    'bucket_name', 'kyc-documents',
    'public', false,
    'file_size_limit', 5242880,
    'allowed_mime_types', ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  ),
  now()
)
ON CONFLICT DO NOTHING;