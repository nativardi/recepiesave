-- Description: Storage bucket setup for SaveIt Recipe Edition

-- Create storage buckets for thumbnails and audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-thumbnails', 'recipe-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-audio', 'recipe-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnails bucket (public read, authenticated write)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for audio bucket (authenticated access only)
CREATE POLICY "Users can view own audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recipe-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-audio' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
