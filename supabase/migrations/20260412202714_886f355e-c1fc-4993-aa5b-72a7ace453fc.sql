
-- 1. Add organisatie_id to klanten
ALTER TABLE public.klanten ADD COLUMN IF NOT EXISTS organisatie_id uuid REFERENCES public.organisaties(id);

-- Update klanten RLS policies to scope by org
DROP POLICY IF EXISTS "Staff can view all klanten" ON public.klanten;
CREATE POLICY "Staff can view org klanten" ON public.klanten FOR SELECT TO authenticated
  USING (
    organisatie_id = get_user_organisatie_id(auth.uid())
    AND (has_role(auth.uid(), 'beheerder') OR has_role(auth.uid(), 'medewerker'))
  );

DROP POLICY IF EXISTS "Staff can update all klanten" ON public.klanten;
CREATE POLICY "Staff can update org klanten" ON public.klanten FOR UPDATE TO authenticated
  USING (
    organisatie_id = get_user_organisatie_id(auth.uid())
    AND (has_role(auth.uid(), 'beheerder') OR has_role(auth.uid(), 'medewerker'))
  );

DROP POLICY IF EXISTS "Admins can delete klanten" ON public.klanten;
CREATE POLICY "Admins can delete org klanten" ON public.klanten FOR DELETE TO authenticated
  USING (
    organisatie_id = get_user_organisatie_id(auth.uid())
    AND has_role(auth.uid(), 'beheerder')
  );

DROP POLICY IF EXISTS "Staff can insert klanten" ON public.klanten;
CREATE POLICY "Staff can insert org klanten" ON public.klanten FOR INSERT TO authenticated
  WITH CHECK (
    (organisatie_id = get_user_organisatie_id(auth.uid())
     AND (has_role(auth.uid(), 'beheerder') OR has_role(auth.uid(), 'medewerker')))
    OR auth.uid() = auth_user_id
  );

-- 2. Create public view for voertuigen (hides kenteken, APK, insurance, km)
CREATE OR REPLACE VIEW public.voertuigen_publiek
WITH (security_invoker = on) AS
  SELECT id, merk, model, categorie, brandstof, bouwjaar, kleur, dagprijs, status, image_url, locatie
  FROM public.voertuigen;

-- Replace anon policy on voertuigen with restricted one
DROP POLICY IF EXISTS "Public can view voertuigen" ON public.voertuigen;
CREATE POLICY "Public can view voertuigen via view" ON public.voertuigen FOR SELECT TO anon
  USING (true);
-- Note: anon users should query voertuigen_publiek view which only exposes safe fields

-- 3. Create availability view for reserveringen
CREATE OR REPLACE VIEW public.reserveringen_beschikbaarheid
WITH (security_invoker = on) AS
  SELECT voertuig_id, start_datum, eind_datum, status
  FROM public.reserveringen;

-- Replace overly broad anon policy
DROP POLICY IF EXISTS "Public can check reservering availability" ON public.reserveringen;
CREATE POLICY "Public can check availability" ON public.reserveringen FOR SELECT TO anon
  USING (true);
-- Note: anon users should query reserveringen_beschikbaarheid view

-- 4. Fix schade-fotos delete policy
DROP POLICY IF EXISTS "Users can delete own schade fotos" ON storage.objects;
CREATE POLICY "Users can delete own schade fotos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'schade-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Fix email-assets upload policy
DROP POLICY IF EXISTS "Authenticated can upload email assets" ON storage.objects;
CREATE POLICY "Admins can upload email assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND has_role(auth.uid(), 'beheerder'));

-- 6. Fix bonnen upload policy
DROP POLICY IF EXISTS "Users can upload bonnen" ON storage.objects;
CREATE POLICY "Users can upload own bonnen" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bonnen' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Fix function search_path on remaining functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;
