-- Public bucket voor AI-gegenereerde voertuigafbeeldingen
INSERT INTO storage.buckets (id, name, public)
VALUES ('voertuig-afbeeldingen', 'voertuig-afbeeldingen', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Iedereen mag lezen (public bucket, maar policy voor de zekerheid)
CREATE POLICY "Voertuig afbeeldingen publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voertuig-afbeeldingen');

-- Authenticated users mogen uploaden binnen eigen organisatie-map
CREATE POLICY "Org leden uploaden voertuig afbeeldingen"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voertuig-afbeeldingen'
    AND (storage.foldername(name))[1] = get_user_organisatie_id(auth.uid())::text
  );

CREATE POLICY "Org leden updaten voertuig afbeeldingen"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'voertuig-afbeeldingen'
    AND (storage.foldername(name))[1] = get_user_organisatie_id(auth.uid())::text
  );

CREATE POLICY "Org leden verwijderen voertuig afbeeldingen"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voertuig-afbeeldingen'
    AND (storage.foldername(name))[1] = get_user_organisatie_id(auth.uid())::text
  );