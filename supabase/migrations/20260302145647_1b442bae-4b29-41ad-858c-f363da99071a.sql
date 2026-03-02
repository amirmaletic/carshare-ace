
-- Create storage bucket for damage photos
INSERT INTO storage.buckets (id, name, public) VALUES ('schade-fotos', 'schade-fotos', true);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload schade fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'schade-fotos');

-- Allow public read access
CREATE POLICY "Schade fotos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'schade-fotos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own schade fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'schade-fotos');

-- Add fotos column to schade_rapporten
ALTER TABLE public.schade_rapporten ADD COLUMN fotos text[] DEFAULT '{}';
