-- Drop bestaande functie en herdefinieer met optionele datum parameters
DROP FUNCTION IF EXISTS public.get_publiek_aanbod(uuid);

CREATE OR REPLACE FUNCTION public.get_publiek_aanbod(
  _organisatie_id uuid,
  _start_datum date DEFAULT NULL,
  _eind_datum date DEFAULT NULL
)
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
    -- Geen overlap met actieve/aangevraagde reserveringen
    AND (
      _start_datum IS NULL OR _eind_datum IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.reserveringen r
        WHERE r.voertuig_id = v.id
          AND r.status IN ('aangevraagd','bevestigd','actief')
          AND daterange(r.start_datum, r.eind_datum, '[]') && daterange(_start_datum, _eind_datum, '[]')
      )
    )
    -- Geen overlap met actieve/concept contracten (voertuig_id is text, vergelijk met v.id::text en met kenteken)
    AND (
      _start_datum IS NULL OR _eind_datum IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE (c.voertuig_id = v.id::text OR c.voertuig_id = v.kenteken)
          AND c.status IN ('actief','concept')
          AND daterange(c.start_datum, c.eind_datum, '[]') && daterange(_start_datum, _eind_datum, '[]')
      )
    )
    -- Geen overlap met planning blokken (onderhoud, blokkade)
    AND (
      _start_datum IS NULL OR _eind_datum IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.planning_blokken p
        WHERE p.voertuig_id = v.id
          AND daterange(p.start_datum, p.eind_datum, '[]') && daterange(_start_datum, _eind_datum, '[]')
      )
    )
  ORDER BY v.dagprijs ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_publiek_aanbod(uuid, date, date) TO anon, authenticated;