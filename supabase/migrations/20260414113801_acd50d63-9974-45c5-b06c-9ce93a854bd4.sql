
-- 1. Remove the overly permissive anon policy on voertuigen
DROP POLICY IF EXISTS "Public can view voertuigen via view" ON public.voertuigen;

-- 2. Remove the overly permissive anon policy on reserveringen
DROP POLICY IF EXISTS "Public can check availability" ON public.reserveringen;

-- 3. Grant anon access to the existing restricted views instead
-- The voertuigen_publiek view already exists and only exposes safe fields.
-- The reserveringen_beschikbaarheid view already exists and only exposes safe fields.
GRANT SELECT ON public.voertuigen_publiek TO anon;
GRANT SELECT ON public.reserveringen_beschikbaarheid TO anon;
