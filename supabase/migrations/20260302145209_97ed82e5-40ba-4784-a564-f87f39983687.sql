
-- Eigendomshistorie
CREATE TABLE public.eigendom_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voertuig_id text NOT NULL,
  user_id uuid NOT NULL,
  eigenaar_naam text NOT NULL,
  eigenaar_type text NOT NULL DEFAULT 'particulier', -- particulier, bedrijf, lease
  start_datum date NOT NULL,
  eind_datum date,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eigendom_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own eigendom_historie" ON public.eigendom_historie FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own eigendom_historie" ON public.eigendom_historie FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own eigendom_historie" ON public.eigendom_historie FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own eigendom_historie" ON public.eigendom_historie FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_eigendom_voertuig ON public.eigendom_historie(voertuig_id);

-- Servicehistorie
CREATE TABLE public.service_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voertuig_id text NOT NULL,
  user_id uuid NOT NULL,
  datum date NOT NULL,
  type text NOT NULL DEFAULT 'onderhoud', -- onderhoud, apk, reparatie, bandenwissel, overig
  omschrijving text NOT NULL,
  kosten numeric DEFAULT 0,
  garage text,
  kilometerstand integer,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service_historie" ON public.service_historie FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own service_historie" ON public.service_historie FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service_historie" ON public.service_historie FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own service_historie" ON public.service_historie FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_service_voertuig ON public.service_historie(voertuig_id);

-- Schaderapporten
CREATE TABLE public.schade_rapporten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voertuig_id text NOT NULL,
  user_id uuid NOT NULL,
  datum date NOT NULL,
  omschrijving text NOT NULL,
  locatie_schade text, -- voor, achter, links, rechts, dak, etc.
  ernst text NOT NULL DEFAULT 'licht', -- licht, matig, zwaar, total_loss
  kosten numeric DEFAULT 0,
  verzekerd boolean DEFAULT false,
  hersteld boolean DEFAULT false,
  herstel_datum date,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schade_rapporten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schade_rapporten" ON public.schade_rapporten FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own schade_rapporten" ON public.schade_rapporten FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schade_rapporten" ON public.schade_rapporten FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schade_rapporten" ON public.schade_rapporten FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_schade_voertuig ON public.schade_rapporten(voertuig_id);
