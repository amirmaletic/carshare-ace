
-- Public lookup van portaal via slug (voor /t/:slug routes en preview-omgevingen)
CREATE OR REPLACE FUNCTION public.get_portaal_by_slug(_slug text)
RETURNS TABLE(id uuid, naam text, slug text, portaal_naam text, portaal_logo_url text, portaal_kleur text, portaal_welkomtekst text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.naam, o.slug, o.portaal_naam, o.portaal_logo_url, o.portaal_kleur, o.portaal_welkomtekst
  FROM public.organisaties o
  WHERE o.portaal_actief = true
    AND lower(o.slug) = lower(trim(_slug))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_portaal_by_slug(text) TO anon, authenticated;

-- Public lookup van beschikbaar aanbod per organisatie (alleen als portaal actief is)
CREATE OR REPLACE FUNCTION public.get_publiek_aanbod(_organisatie_id uuid)
RETURNS TABLE(
  id uuid, merk text, model text, bouwjaar integer, brandstof text,
  categorie text, kleur text, dagprijs numeric, image_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.merk, v.model, v.bouwjaar, v.brandstof, v.categorie, v.kleur, v.dagprijs, v.image_url
  FROM public.voertuigen v
  JOIN public.organisaties o ON o.id = v.organisatie_id
  WHERE v.organisatie_id = _organisatie_id
    AND o.portaal_actief = true
    AND v.status = 'beschikbaar'
  ORDER BY v.dagprijs ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_publiek_aanbod(uuid) TO anon, authenticated;
