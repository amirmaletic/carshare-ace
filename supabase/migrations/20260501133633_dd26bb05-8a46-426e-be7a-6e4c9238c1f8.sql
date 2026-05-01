
-- Drop oude globale unique constraint
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_module_key;

-- 1. Add organisatie_id (nullable initially) - already added in previous failed attempt
ALTER TABLE public.role_permissions
  ADD COLUMN IF NOT EXISTS organisatie_id uuid;

-- 2. Backfill
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM public.organisaties LOOP
    INSERT INTO public.role_permissions (role, module, allowed, organisatie_id)
    SELECT rp.role, rp.module, rp.allowed, org.id
    FROM public.role_permissions rp
    WHERE rp.organisatie_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.role_permissions rp2
        WHERE rp2.organisatie_id = org.id
          AND rp2.role = rp.role
          AND rp2.module = rp.module
      );
  END LOOP;
END $$;

DELETE FROM public.role_permissions WHERE organisatie_id IS NULL;

ALTER TABLE public.role_permissions
  ALTER COLUMN organisatie_id SET NOT NULL;

DROP INDEX IF EXISTS role_permissions_role_module_org_idx;
CREATE UNIQUE INDEX role_permissions_role_module_org_idx
  ON public.role_permissions (organisatie_id, role, module);

DROP POLICY IF EXISTS "Admins can manage own org permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Org members can view permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Beheerders can manage permissions" ON public.role_permissions;

CREATE POLICY "Org members can view permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Beheerders can manage permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
)
WITH CHECK (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE OR REPLACE FUNCTION public.set_role_permission_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.organisatie_id IS NULL THEN
    NEW.organisatie_id := public.get_user_organisatie_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_role_permission_org_trg ON public.role_permissions;
CREATE TRIGGER set_role_permission_org_trg
BEFORE INSERT ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_role_permission_org();
