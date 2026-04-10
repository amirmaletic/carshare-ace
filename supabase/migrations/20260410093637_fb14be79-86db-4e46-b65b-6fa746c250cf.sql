-- Add damage points field to schade_rapporten
ALTER TABLE public.schade_rapporten
ADD COLUMN schade_punten jsonb DEFAULT '[]'::jsonb;

-- Create activiteiten_log table
CREATE TABLE public.activiteiten_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actie text NOT NULL,
  beschrijving text NOT NULL,
  entiteit_type text,
  entiteit_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activiteiten_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own activities"
  ON public.activiteiten_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities"
  ON public.activiteiten_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all activities"
  ON public.activiteiten_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'beheerder'::app_role) OR has_role(auth.uid(), 'medewerker'::app_role));

CREATE INDEX idx_activiteiten_log_user ON public.activiteiten_log(user_id);
CREATE INDEX idx_activiteiten_log_created ON public.activiteiten_log(created_at DESC);