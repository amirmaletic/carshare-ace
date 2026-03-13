
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('beheerder', 'medewerker', 'chauffeur', 'klant');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'beheerder'))
  WITH CHECK (public.has_role(auth.uid(), 'beheerder'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create role_permissions table (which modules each role can access)
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, module)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read permissions (needed for UI routing)
CREATE POLICY "Authenticated users can view permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify permissions
CREATE POLICY "Admins can manage permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'beheerder'))
  WITH CHECK (public.has_role(auth.uid(), 'beheerder'));

-- Insert default permissions (all roles get access to everything by default)
INSERT INTO public.role_permissions (role, module, allowed) VALUES
  ('beheerder', 'dashboard', true),
  ('beheerder', 'voertuigen', true),
  ('beheerder', 'terugmelden', true),
  ('beheerder', 'contracten', true),
  ('beheerder', 'reserveringen', true),
  ('beheerder', 'onderhoud', true),
  ('beheerder', 'rapportages', true),
  ('beheerder', 'kosten', true),
  ('beheerder', 'instellingen', true),
  ('medewerker', 'dashboard', true),
  ('medewerker', 'voertuigen', true),
  ('medewerker', 'terugmelden', true),
  ('medewerker', 'contracten', true),
  ('medewerker', 'reserveringen', true),
  ('medewerker', 'onderhoud', true),
  ('medewerker', 'rapportages', true),
  ('medewerker', 'kosten', true),
  ('medewerker', 'instellingen', false),
  ('chauffeur', 'dashboard', true),
  ('chauffeur', 'voertuigen', false),
  ('chauffeur', 'terugmelden', true),
  ('chauffeur', 'contracten', false),
  ('chauffeur', 'reserveringen', true),
  ('chauffeur', 'onderhoud', false),
  ('chauffeur', 'rapportages', false),
  ('chauffeur', 'kosten', false),
  ('chauffeur', 'instellingen', false),
  ('klant', 'dashboard', true),
  ('klant', 'voertuigen', false),
  ('klant', 'terugmelden', true),
  ('klant', 'contracten', false),
  ('klant', 'reserveringen', true),
  ('klant', 'onderhoud', false),
  ('klant', 'rapportages', false),
  ('klant', 'kosten', false),
  ('klant', 'instellingen', false);
