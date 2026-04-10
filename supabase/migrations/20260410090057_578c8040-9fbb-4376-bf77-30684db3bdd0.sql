
-- Allow public read access to voertuigen for browsing
CREATE POLICY "Public can view voertuigen"
ON public.voertuigen FOR SELECT TO anon
USING (true);

-- Allow public read of reserveringen status for availability check
CREATE POLICY "Public can check reservering availability"
ON public.reserveringen FOR SELECT TO anon
USING (true);
