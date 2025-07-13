# Image Upload Setup Guide

## Fix "Bucket not found" Error

The error "Upload failed: Bucket not found" means the Supabase storage bucket hasn't been created yet. Follow these steps to fix it:

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Setup Script

Copy and paste this SQL script into the SQL Editor:

```sql
-- Create the images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "User Management" ON storage.objects
FOR ALL USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);
```

### Step 3: Click "Run"

Click the "Run" button to execute the script.

### Step 4: Test the Upload

1. Go to `/test-upload` in your application
2. Try uploading an image
3. The upload should now work!

## What This Script Does

1. **Creates Storage Bucket**: Creates a public bucket named "images"
2. **Public Read Access**: Allows anyone to view uploaded images
3. **Authenticated Uploads**: Only authenticated users can upload
4. **User Management**: Users can update/delete their own uploads

## Alternative: Manual Setup

If you prefer to set up storage manually:

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it `images`
4. Make it **public**
5. Set up the policies manually

## Testing

After setup, you can test the upload functionality:

1. Visit `/test-upload` in your app
2. Try uploading an image
3. Check the browser console for any errors
4. Verify the image appears in your Supabase Storage dashboard

## Troubleshooting

### Still Getting "Bucket not found"?

- Make sure you're logged into the correct Supabase project
- Check that the SQL script ran successfully
- Verify the bucket exists in the Storage section

### Permission Errors?

- Ensure you're authenticated in your app
- Check that the RLS policies are set up correctly
- Verify your environment variables are correct

### Images Not Loading?

- Check that the bucket is set to public
- Verify the image URLs in your database
- Clear browser cache

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Support

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correct
4. Check the Supabase documentation for storage setup
