
CREATE TYPE public.betaal_verificatie_status AS ENUM ('in_afwachting','betaald','mislukt','verlopen');

CREATE TABLE public.betaal_verificaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  klant_id uuid REFERENCES public.klanten(id) ON DELETE SET NULL,
  bedrag numeric(10,2) NOT NULL DEFAULT 0.01,
  valuta text NOT NULL DEFAULT 'EUR',
  status public.betaal_verificatie_status NOT NULL DEFAULT 'in_afwachting',
  stripe_session_id text,
  stripe_payment_intent_id text,
  iban text,
  naam_rekeninghouder text,
  upload_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  token_expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  betaald_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_betaal_verificaties_org ON public.betaal_verificaties(organisatie_id);
CREATE INDEX idx_betaal_verificaties_contract ON public.betaal_verificaties(contract_id);
CREATE INDEX idx_betaal_verificaties_token ON public.betaal_verificaties(upload_token);

ALTER TABLE public.betaal_verificaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org leden zien borg verificaties"
  ON public.betaal_verificaties FOR SELECT TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org leden maken borg verificaties"
  ON public.betaal_verificaties FOR INSERT TO authenticated
  WITH CHECK (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org leden updaten borg verificaties"
  ON public.betaal_verificaties FOR UPDATE TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE TRIGGER trg_betaal_verificaties_updated
  BEFORE UPDATE ON public.betaal_verificaties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_betaal_verzoek(_token text)
RETURNS TABLE(
  id uuid, status public.betaal_verificatie_status,
  bedrag numeric, valuta text,
  klant_voornaam text, klant_achternaam text,
  organisatie_naam text, organisatie_logo text, organisatie_kleur text,
  expired boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.status, b.bedrag, b.valuta,
         k.voornaam, k.achternaam,
         o.naam, o.portaal_logo_url, o.portaal_kleur,
         (b.token_expires_at < now())
  FROM public.betaal_verificaties b
  LEFT JOIN public.klanten k ON k.id = b.klant_id
  JOIN public.organisaties o ON o.id = b.organisatie_id
  WHERE b.upload_token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.markeer_betaal_verificatie_betaald(
  _session_id text, _payment_intent_id text, _iban text, _naam text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  UPDATE public.betaal_verificaties
  SET status = 'betaald',
      stripe_payment_intent_id = _payment_intent_id,
      iban = _iban,
      naam_rekeninghouder = _naam,
      betaald_op = now(),
      updated_at = now()
  WHERE stripe_session_id = _session_id
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
