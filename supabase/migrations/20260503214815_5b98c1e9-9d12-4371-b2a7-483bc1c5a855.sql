CREATE TABLE public.copilot_geheugen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  organisatie_id uuid,
  feit text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_geheugen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own copilot memory"
ON public.copilot_geheugen
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_copilot_geheugen_user ON public.copilot_geheugen(user_id, created_at DESC);