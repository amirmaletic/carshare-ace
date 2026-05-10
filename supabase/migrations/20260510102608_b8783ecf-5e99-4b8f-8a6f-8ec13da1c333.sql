-- Email templates table for the visual block editor
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL,
  slug text NOT NULL,
  naam text NOT NULL,
  onderwerp text NOT NULL DEFAULT '',
  blokken jsonb NOT NULL DEFAULT '[]'::jsonb,
  achtergrond_kleur text NOT NULL DEFAULT '#ffffff',
  accent_kleur text NOT NULL DEFAULT '#3B82F6',
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisatie_id, slug)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org leden zien email templates"
ON public.email_templates FOR SELECT TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Beheerders beheren email templates"
ON public.email_templates FOR ALL TO authenticated
USING ((organisatie_id = get_user_organisatie_id(auth.uid())) AND has_role(auth.uid(), 'beheerder'::app_role))
WITH CHECK ((organisatie_id = get_user_organisatie_id(auth.uid())) AND has_role(auth.uid(), 'beheerder'::app_role));

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_email_templates_org ON public.email_templates(organisatie_id);