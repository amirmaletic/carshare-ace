-- Goedkeuring regels per organisatie
CREATE TABLE IF NOT EXISTS public.goedkeuring_regels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  actie_type text NOT NULL,
  actief boolean NOT NULL DEFAULT true,
  drempel_bedrag numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisatie_id, actie_type)
);

ALTER TABLE public.goedkeuring_regels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view goedkeuring_regels"
ON public.goedkeuring_regels FOR SELECT TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Admins can manage goedkeuring_regels"
ON public.goedkeuring_regels FOR ALL TO authenticated
USING (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
)
WITH CHECK (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE TRIGGER update_goedkeuring_regels_updated_at
BEFORE UPDATE ON public.goedkeuring_regels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Goedkeuringen (verzoeken)
CREATE TABLE IF NOT EXISTS public.goedkeuringen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  aangevraagd_door uuid NOT NULL,
  beoordeeld_door uuid,
  actie_type text NOT NULL,
  entiteit_type text,
  entiteit_id text,
  beschrijving text NOT NULL,
  bedrag numeric,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'in_behandeling',
  reden_afwijzing text,
  beoordeeld_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goedkeuringen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can create goedkeuringen"
ON public.goedkeuringen FOR INSERT TO authenticated
WITH CHECK (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND aangevraagd_door = auth.uid()
);

CREATE POLICY "Approvers and requesters can view goedkeuringen"
ON public.goedkeuringen FOR SELECT TO authenticated
USING (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND (
    aangevraagd_door = auth.uid()
    OR has_role(auth.uid(), 'beheerder'::app_role)
    OR has_role(auth.uid(), 'leidinggevende'::app_role)
  )
);

CREATE POLICY "Approvers can update goedkeuringen"
ON public.goedkeuringen FOR UPDATE TO authenticated
USING (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND (
    has_role(auth.uid(), 'beheerder'::app_role)
    OR has_role(auth.uid(), 'leidinggevende'::app_role)
  )
)
WITH CHECK (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND (
    has_role(auth.uid(), 'beheerder'::app_role)
    OR has_role(auth.uid(), 'leidinggevende'::app_role)
  )
);

CREATE POLICY "Admins can delete goedkeuringen"
ON public.goedkeuringen FOR DELETE TO authenticated
USING (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE TRIGGER update_goedkeuringen_updated_at
BEFORE UPDATE ON public.goedkeuringen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_goedkeuringen_org_status ON public.goedkeuringen(organisatie_id, status);
CREATE INDEX IF NOT EXISTS idx_goedkeuringen_aanvrager ON public.goedkeuringen(aangevraagd_door);