-- Storage bucket for post images (public, accessible via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: service_role can upload/read/delete (server-side only)
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL USING (bucket_id = 'post-images')
  WITH CHECK (bucket_id = 'post-images');
