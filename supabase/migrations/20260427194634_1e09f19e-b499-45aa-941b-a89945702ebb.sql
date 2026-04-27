
-- Indexen
CREATE INDEX IF NOT EXISTS idx_voertuigen_organisatie_id ON public.voertuigen(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_contracts_organisatie_id ON public.contracts(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_reserveringen_klant_id ON public.reserveringen(klant_id);
CREATE INDEX IF NOT EXISTS idx_reserveringen_voertuig_id ON public.reserveringen(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_klanten_organisatie_id ON public.klanten(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_klanten_auth_user_id ON public.klanten(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organisatie_id ON public.invoices(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON public.invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_schade_rapporten_organisatie_id ON public.schade_rapporten(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_schade_rapporten_voertuig_id ON public.schade_rapporten(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_service_historie_organisatie_id ON public.service_historie(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_service_historie_voertuig_id ON public.service_historie(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_terugmeldingen_organisatie_id ON public.terugmeldingen(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_terugmeldingen_voertuig_id ON public.terugmeldingen(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_chauffeurs_organisatie_id ON public.chauffeurs(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_chauffeur_beschikbaarheid_organisatie_id ON public.chauffeur_beschikbaarheid(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_chauffeur_beschikbaarheid_chauffeur_id ON public.chauffeur_beschikbaarheid(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_ritten_organisatie_id ON public.ritten(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_ritten_voertuig_id ON public.ritten(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_ritten_chauffeur_id ON public.ritten(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_overdrachten_organisatie_id ON public.overdrachten(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_overdrachten_contract_id ON public.overdrachten(contract_id);
CREATE INDEX IF NOT EXISTS idx_overdrachten_voertuig_id ON public.overdrachten(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_kilometer_registraties_organisatie_id ON public.kilometer_registraties(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_kilometer_registraties_contract_id ON public.kilometer_registraties(contract_id);
CREATE INDEX IF NOT EXISTS idx_eigendom_historie_organisatie_id ON public.eigendom_historie(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_eigendom_historie_voertuig_id ON public.eigendom_historie(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_locaties_organisatie_id ON public.locaties(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_aanvragen_organisatie_id ON public.aanvragen(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_activiteiten_log_organisatie_id ON public.activiteiten_log(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_activiteiten_log_created_at ON public.activiteiten_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organisatie_id ON public.user_roles(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_uitnodigingen_email ON public.uitnodigingen(email);
CREATE INDEX IF NOT EXISTS idx_uitnodigingen_organisatie_id ON public.uitnodigingen(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_goedkeuringen_organisatie_id ON public.goedkeuringen(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_goedkeuringen_status ON public.goedkeuringen(status);
CREATE INDEX IF NOT EXISTS idx_goedkeuring_regels_organisatie_id ON public.goedkeuring_regels(organisatie_id);

-- Foreign keys (alleen toevoegen indien nog niet aanwezig) via DO block
DO $$
BEGIN
  -- Cleanup wezen
  DELETE FROM public.invoices WHERE contract_id NOT IN (SELECT id FROM public.contracts);

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_contract_id_fkey') THEN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_organisatie_id_fkey') THEN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_organisatie_id_fkey
      FOREIGN KEY (organisatie_id) REFERENCES public.organisaties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goedkeuringen_organisatie_id_fkey') THEN
    ALTER TABLE public.goedkeuringen ADD CONSTRAINT goedkeuringen_organisatie_id_fkey
      FOREIGN KEY (organisatie_id) REFERENCES public.organisaties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goedkeuring_regels_organisatie_id_fkey') THEN
    ALTER TABLE public.goedkeuring_regels ADD CONSTRAINT goedkeuring_regels_organisatie_id_fkey
      FOREIGN KEY (organisatie_id) REFERENCES public.organisaties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Hardening: organisaties policies naar authenticated role
DROP POLICY IF EXISTS "Members can view own org" ON public.organisaties;
DROP POLICY IF EXISTS "Owner can update own org" ON public.organisaties;

CREATE POLICY "Members can view own org"
  ON public.organisaties FOR SELECT TO authenticated
  USING (id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Owner can update own org"
  ON public.organisaties FOR UPDATE TO authenticated
  USING (eigenaar_id = auth.uid());
