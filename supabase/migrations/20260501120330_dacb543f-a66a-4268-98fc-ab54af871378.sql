
-- 1. Storage bucket voor rijbewijzen (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rijbewijzen', 'rijbewijzen', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enum voor verificatiestatus
DO $$ BEGIN
  CREATE TYPE public.rijbewijs_status AS ENUM (
    'in_afwachting', 'ingediend', 'goedgekeurd', 'afgewezen', 'verlopen'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Hoofdtabel
CREATE TABLE IF NOT EXISTS public.rijbewijs_verificaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  klant_id uuid NOT NULL REFERENCES public.klanten(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  status public.rijbewijs_status NOT NULL DEFAULT 'in_afwachting',
  upload_token text NOT NULL UNIQUE,
  token_expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  voorkant_pad text,
  achterkant_pad text,
  ingediend_op timestamptz,
  -- AI-extractie
  ai_naam text,
  ai_geboortedatum date,
  ai_rijbewijsnummer text,
  ai_categorieen text[],
  ai_afgiftedatum date,
  ai_vervaldatum date,
  ai_confidence numeric,
  ai_ruwe_data jsonb,
  -- Validatie
  validatie_notities text,
  beoordeeld_door uuid,
  beoordeeld_op timestamptz,
  reden_afwijzing text,
  -- Email tracking
  email_verzonden_op timestamptz,
  herinnering_verzonden_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rijbewijs_org ON public.rijbewijs_verificaties(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_rijbewijs_klant ON public.rijbewijs_verificaties(klant_id);
CREATE INDEX IF NOT EXISTS idx_rijbewijs_token ON public.rijbewijs_verificaties(upload_token);
CREATE INDEX IF NOT EXISTS idx_rijbewijs_status ON public.rijbewijs_verificaties(status);

ALTER TABLE public.rijbewijs_verificaties ENABLE ROW LEVEL SECURITY;

-- RLS: Alleen eigen organisatie
CREATE POLICY "Org leden kunnen rijbewijzen bekijken"
ON public.rijbewijs_verificaties FOR SELECT
USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org leden kunnen rijbewijzen aanmaken"
ON public.rijbewijs_verificaties FOR INSERT
WITH CHECK (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org leden kunnen rijbewijzen wijzigen"
ON public.rijbewijs_verificaties FOR UPDATE
USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org leden kunnen rijbewijzen verwijderen"
ON public.rijbewijs_verificaties FOR DELETE
USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_rijbewijs_updated ON public.rijbewijs_verificaties;
CREATE TRIGGER trg_rijbewijs_updated
BEFORE UPDATE ON public.rijbewijs_verificaties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage policies voor rijbewijzen bucket
-- Pad-conventie: {organisatie_id}/{verificatie_id}/{voorkant|achterkant}.{ext}
CREATE POLICY "Org leden kunnen eigen rijbewijs-scans bekijken"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rijbewijzen'
  AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid())
);

CREATE POLICY "Org leden kunnen rijbewijs-scans uploaden"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rijbewijzen'
  AND (
    -- Org-leden mogen uploaden in eigen org-folder
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid()))
    OR
    -- Anonieme uploads via edge function (service role bypass) toegestaan
    auth.uid() IS NULL
  )
);

CREATE POLICY "Org leden kunnen eigen rijbewijs-scans verwijderen"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rijbewijzen'
  AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid())
);

-- 5. Publieke RPC: ophalen verzoek via token (voor publieke upload-pagina)
CREATE OR REPLACE FUNCTION public.get_rijbewijs_verzoek(_token text)
RETURNS TABLE(
  id uuid,
  status public.rijbewijs_status,
  klant_voornaam text,
  klant_achternaam text,
  organisatie_naam text,
  organisatie_logo text,
  organisatie_kleur text,
  expired boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    r.id,
    r.status,
    k.voornaam,
    k.achternaam,
    o.naam,
    o.portaal_logo_url,
    o.portaal_kleur,
    (r.token_expires_at < now()) AS expired
  FROM public.rijbewijs_verificaties r
  JOIN public.klanten k ON k.id = r.klant_id
  JOIN public.organisaties o ON o.id = r.organisatie_id
  WHERE r.upload_token = _token
  LIMIT 1;
$$;

-- 6. RPC: markeer verificatie als ingediend (na upload)
CREATE OR REPLACE FUNCTION public.markeer_rijbewijs_ingediend(
  _token text,
  _voorkant_pad text,
  _achterkant_pad text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  UPDATE public.rijbewijs_verificaties
  SET status = 'ingediend',
      voorkant_pad = _voorkant_pad,
      achterkant_pad = _achterkant_pad,
      ingediend_op = now(),
      updated_at = now()
  WHERE upload_token = _token
    AND token_expires_at > now()
    AND status IN ('in_afwachting', 'afgewezen')
  RETURNING id INTO _id;

  IF _id IS NULL THEN
    RAISE EXCEPTION 'Ongeldig of verlopen token';
  END IF;

  RETURN _id;
END;
$$;

-- 7. RPC: AI-resultaat opslaan (vanuit edge function)
CREATE OR REPLACE FUNCTION public.update_rijbewijs_ai_resultaat(
  _id uuid,
  _ai_naam text,
  _ai_geboortedatum date,
  _ai_rijbewijsnummer text,
  _ai_categorieen text[],
  _ai_afgiftedatum date,
  _ai_vervaldatum date,
  _ai_confidence numeric,
  _ai_ruwe_data jsonb,
  _validatie_notities text,
  _auto_status public.rijbewijs_status
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.rijbewijs_verificaties
  SET ai_naam = _ai_naam,
      ai_geboortedatum = _ai_geboortedatum,
      ai_rijbewijsnummer = _ai_rijbewijsnummer,
      ai_categorieen = _ai_categorieen,
      ai_afgiftedatum = _ai_afgiftedatum,
      ai_vervaldatum = _ai_vervaldatum,
      ai_confidence = _ai_confidence,
      ai_ruwe_data = _ai_ruwe_data,
      validatie_notities = _validatie_notities,
      status = _auto_status,
      updated_at = now()
  WHERE id = _id;
END;
$$;

-- 8. Trigger: auto-aanmaken rijbewijsverzoek bij nieuw contract
CREATE OR REPLACE FUNCTION public.auto_create_rijbewijs_verzoek()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _bestaat boolean;
  _token text;
BEGIN
  -- Check of klant al een geldige goedgekeurde scan heeft (niet verlopen)
  SELECT EXISTS(
    SELECT 1 FROM public.rijbewijs_verificaties
    WHERE klant_id = NEW.klant_id
      AND status = 'goedgekeurd'
      AND (ai_vervaldatum IS NULL OR ai_vervaldatum > CURRENT_DATE)
  ) INTO _bestaat;

  IF _bestaat THEN
    RETURN NEW;
  END IF;

  -- Check of er al een open verzoek loopt voor dit contract
  SELECT EXISTS(
    SELECT 1 FROM public.rijbewijs_verificaties
    WHERE klant_id = NEW.klant_id
      AND status IN ('in_afwachting', 'ingediend')
      AND token_expires_at > now()
  ) INTO _bestaat;

  IF _bestaat THEN
    RETURN NEW;
  END IF;

  -- Genereer nieuw verzoek
  _token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.rijbewijs_verificaties (
    organisatie_id, klant_id, contract_id, upload_token, status
  ) VALUES (
    NEW.organisatie_id, NEW.klant_id, NEW.id, _token, 'in_afwachting'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_rijbewijs_verzoek ON public.contracts;
CREATE TRIGGER trg_auto_rijbewijs_verzoek
AFTER INSERT ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.auto_create_rijbewijs_verzoek();
