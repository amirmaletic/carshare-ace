-- ===== Tenant klantportaal: branding + slug + custom domains =====

-- 1) Branding & slug op organisaties
ALTER TABLE public.organisaties
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS portaal_naam text,
  ADD COLUMN IF NOT EXISTS portaal_logo_url text,
  ADD COLUMN IF NOT EXISTS portaal_kleur text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS portaal_actief boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portaal_welkomtekst text;

-- Slug uniek maken (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS organisaties_slug_unique
  ON public.organisaties (lower(slug))
  WHERE slug IS NOT NULL;

-- Slug-validatie trigger: alleen [a-z0-9-], 3-40 tekens, geen reserved
CREATE OR REPLACE FUNCTION public.validate_organisatie_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NOT NULL THEN
    NEW.slug := lower(trim(NEW.slug));
    IF NEW.slug !~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$' THEN
      RAISE EXCEPTION 'Ongeldige slug: gebruik 3-40 tekens, alleen letters, cijfers en koppeltekens';
    END IF;
    IF NEW.slug IN ('www','app','api','admin','dashboard','auth','portaal','boeken','mail','notify','help','support','status','blog','docs','static','assets','cdn','public','login','signup') THEN
      RAISE EXCEPTION 'Slug "%" is gereserveerd, kies een andere', NEW.slug;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_organisatie_slug ON public.organisaties;
CREATE TRIGGER trg_validate_organisatie_slug
  BEFORE INSERT OR UPDATE OF slug ON public.organisaties
  FOR EACH ROW EXECUTE FUNCTION public.validate_organisatie_slug();

-- 2) Tabel voor custom domeinen per organisatie (CNAME flow)
CREATE TABLE IF NOT EXISTS public.portaal_domeinen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  hostname text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | verified | failed
  verification_token text NOT NULL DEFAULT gen_random_uuid()::text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS portaal_domeinen_hostname_unique
  ON public.portaal_domeinen (lower(hostname));

ALTER TABLE public.portaal_domeinen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage portaal_domeinen"
  ON public.portaal_domeinen
  FOR ALL
  TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role))
  WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Org members view portaal_domeinen"
  ON public.portaal_domeinen
  FOR SELECT
  TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE TRIGGER trg_portaal_domeinen_updated
  BEFORE UPDATE ON public.portaal_domeinen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Publieke RPC: zoek tenant op basis van host
-- Returnt alleen non-secret branding velden (geen eigenaar_id, geen trial info)
CREATE OR REPLACE FUNCTION public.get_portaal_by_host(_host text)
RETURNS TABLE(
  id uuid,
  naam text,
  slug text,
  portaal_naam text,
  portaal_logo_url text,
  portaal_kleur text,
  portaal_welkomtekst text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH norm AS (
    SELECT lower(trim(_host)) AS h
  ),
  parts AS (
    SELECT
      h,
      -- subdomein deel voor .fleeflo.nl
      CASE
        WHEN h LIKE '%.fleeflo.nl' THEN split_part(h, '.', 1)
        ELSE NULL
      END AS sub
    FROM norm
  )
  SELECT o.id, o.naam, o.slug, o.portaal_naam, o.portaal_logo_url, o.portaal_kleur, o.portaal_welkomtekst
  FROM public.organisaties o, parts p
  WHERE o.portaal_actief = true
    AND (
      -- via custom domain
      EXISTS (
        SELECT 1 FROM public.portaal_domeinen d
        WHERE d.organisatie_id = o.id
          AND d.status = 'verified'
          AND lower(d.hostname) = p.h
      )
      OR
      -- via subdomein onder fleeflo.nl
      (p.sub IS NOT NULL AND p.sub NOT IN ('www','app','admin','api') AND lower(o.slug) = p.sub)
    )
  LIMIT 1;
$$;

-- Anon mag deze functie aanroepen (publieke landing van het portaal)
GRANT EXECUTE ON FUNCTION public.get_portaal_by_host(text) TO anon, authenticated;

-- 4) Publieke view voor voertuigaanbod per portaal (alleen beschikbare auto's, no PII)
CREATE OR REPLACE VIEW public.portaal_voertuigen
WITH (security_invoker = on)
AS
SELECT
  v.id,
  v.organisatie_id,
  v.merk,
  v.model,
  v.bouwjaar,
  v.brandstof,
  v.categorie,
  v.kleur,
  v.dagprijs,
  v.image_url,
  v.kenteken
FROM public.voertuigen v
JOIN public.organisaties o ON o.id = v.organisatie_id
WHERE o.portaal_actief = true
  AND v.status IN ('beschikbaar', 'gereserveerd', 'verhuurd');

-- Publieke RPC om aanbod per host op te halen
CREATE OR REPLACE FUNCTION public.get_portaal_voertuigen(_host text)
RETURNS TABLE(
  id uuid,
  merk text,
  model text,
  bouwjaar integer,
  brandstof text,
  categorie text,
  kleur text,
  dagprijs numeric,
  image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.merk, v.model, v.bouwjaar, v.brandstof, v.categorie, v.kleur, v.dagprijs, v.image_url
  FROM public.voertuigen v
  WHERE v.organisatie_id = (SELECT id FROM public.get_portaal_by_host(_host))
    AND v.status IN ('beschikbaar')
  ORDER BY v.dagprijs ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_portaal_voertuigen(text) TO anon, authenticated;

-- 5) Bucket voor portaal-logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('portaal-assets', 'portaal-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read portaal-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portaal-assets');

CREATE POLICY "Org admins upload portaal-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portaal-assets'
    AND has_role(auth.uid(), 'beheerder'::app_role)
    AND (storage.foldername(name))[1] = get_user_organisatie_id(auth.uid())::text
  );

CREATE POLICY "Org admins update portaal-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portaal-assets'
    AND has_role(auth.uid(), 'beheerder'::app_role)
    AND (storage.foldername(name))[1] = get_user_organisatie_id(auth.uid())::text
  );

CREATE POLICY "Org admins delete portaal-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portaal-assets'
    AND has_role(auth.uid(), 'beheerder'::app_role)
    AND (storage.foldername(name))[1] = get_user_organisatie_id(auth.uid())::text
  );