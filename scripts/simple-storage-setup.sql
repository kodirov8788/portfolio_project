-- Simple Storage Setup for Image Upload
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create the images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 3. Allow authenticated uploads
CREATE POLICY "Authenticated Uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to update/delete their uploads
CREATE POLICY "User Management" ON storage.objects
FOR ALL USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
); 