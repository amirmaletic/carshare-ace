
ALTER TABLE public.organisaties
  ADD COLUMN IF NOT EXISTS algemene_voorwaarden_pad text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('organisatie-documenten', 'organisatie-documenten', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org leden bekijken eigen documenten"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'organisatie-documenten'
  AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid())
);

CREATE POLICY "Org leden uploaden eigen documenten"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'organisatie-documenten'
  AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid())
);

CREATE POLICY "Org leden vervangen eigen documenten"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'organisatie-documenten'
  AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid())
);

CREATE POLICY "Org leden verwijderen eigen documenten"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'organisatie-documenten'
  AND (storage.foldername(name))[1]::uuid = public.get_user_organisatie_id(auth.uid())
);
