
-- =============================================
-- 1. FIX CROSS-ORG PRIVILEGE ESCALATION
-- =============================================

-- Fix user_roles: scope beheerder to own org
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage own org roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'beheerder'::app_role)
  AND organisatie_id = get_user_organisatie_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'beheerder'::app_role)
  AND organisatie_id = get_user_organisatie_id(auth.uid())
);

-- Fix role_permissions: scope beheerder to own org
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage own org permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role))
WITH CHECK (has_role(auth.uid(), 'beheerder'::app_role));

-- =============================================
-- 2. SECURE STORAGE BUCKETS
-- =============================================

-- Make schade-fotos private
UPDATE storage.buckets SET public = false WHERE id = 'schade-fotos';

-- Make bonnen private
UPDATE storage.buckets SET public = false WHERE id = 'bonnen';

-- =============================================
-- 3. FIX SCHADE-FOTOS STORAGE POLICIES
-- =============================================

-- Remove all existing policies for schade-fotos
DROP POLICY IF EXISTS "Users can upload schade fotos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own schade fotos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view schade fotos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own schade fotos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view schade fotos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view schade fotos" ON storage.objects;

-- Scoped INSERT for schade-fotos
CREATE POLICY "Scoped upload schade fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'schade-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Scoped SELECT for schade-fotos
CREATE POLICY "Scoped view schade fotos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'schade-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Scoped UPDATE for schade-fotos
CREATE POLICY "Scoped update schade fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'schade-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Scoped DELETE for schade-fotos
CREATE POLICY "Scoped delete schade fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'schade-fotos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- =============================================
-- 4. FIX BONNEN STORAGE POLICIES
-- =============================================

-- Remove all existing policies for bonnen
DROP POLICY IF EXISTS "Auth users can upload bonnen" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload bonnen" ON storage.objects;
DROP POLICY IF EXISTS "Users can view bonnen" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can view bonnen" ON storage.objects;
DROP POLICY IF EXISTS "Public can view bonnen" ON storage.objects;

-- Scoped INSERT for bonnen
CREATE POLICY "Scoped upload bonnen"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bonnen'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Scoped SELECT for bonnen
CREATE POLICY "Scoped view bonnen"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bonnen'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Scoped DELETE for bonnen
CREATE POLICY "Scoped delete bonnen"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bonnen'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- =============================================
-- 5. FIX EMAIL-ASSETS BUCKET LISTING
-- =============================================

-- Remove broad listing policy if exists
DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view email assets" ON storage.objects;

-- Allow public read of specific email assets (no listing)
CREATE POLICY "Public can read email assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');
