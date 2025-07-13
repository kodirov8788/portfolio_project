-- Setup Supabase Storage for Image Upload System
-- Run this script in your Supabase SQL Editor

-- Create the images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow public read access to all images
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Policy 2: Allow authenticated users to upload images
CREATE POLICY "Authenticated Uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update their own uploads (based on folder structure)
CREATE POLICY "User Updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND (
    -- Allow updates for general uploads
    storage.foldername(name)[1] = 'uploads'
    OR
    -- Allow updates for user-specific folders
    (storage.foldername(name)[1] = 'avatars' AND auth.uid()::text = storage.foldername(name)[2])
    OR
    -- Allow updates for project/blog owners (you may need to adjust this based on your auth logic)
    storage.foldername(name)[1] IN ('projects', 'blogs')
  )
);

-- Policy 4: Allow users to delete their own uploads
CREATE POLICY "User Deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND (
    -- Allow deletes for general uploads
    storage.foldername(name)[1] = 'uploads'
    OR
    -- Allow deletes for user-specific folders
    (storage.foldername(name)[1] = 'avatars' AND auth.uid()::text = storage.foldername(name)[2])
    OR
    -- Allow deletes for project/blog owners
    storage.foldername(name)[1] IN ('projects', 'blogs')
  )
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a function to get public URL for images
CREATE OR REPLACE FUNCTION get_image_url(path text)
RETURNS text AS $$
BEGIN
  RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/images/' || path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 