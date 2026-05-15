
CREATE OR REPLACE FUNCTION public.get_portaal_locaties(_organisatie_id uuid)
RETURNS TABLE(id uuid, naam text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.naam
  FROM public.locaties l
  JOIN public.organisaties o ON o.id = l.organisatie_id
  WHERE l.organisatie_id = _organisatie_id
    AND o.portaal_actief = true
  ORDER BY l.naam ASC;
$$;
