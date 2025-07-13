# Image Upload System Documentation

This document describes the comprehensive image upload system implemented for the portfolio project using Supabase Storage.

## Overview

The image upload system provides:

- Drag-and-drop file uploads
- Image validation and optimization
- Organized storage structure
- Preview functionality
- Error handling and user feedback

## Architecture

### Components

1. **StorageService** (`src/lib/services/storage-service.ts`)

   - Core service for handling file uploads
   - File validation and optimization
   - Supabase Storage integration

2. **ImageUpload Component** (`src/components/ui/image-upload.tsx`)

   - Reusable React component
   - Drag-and-drop interface
   - Preview and management features

3. **API Route** (`src/app/api/upload-image/route.ts`)
   - Server-side upload handling
   - Additional validation and processing

### Storage Structure

```
supabase-storage/
└── images/
    ├── avatars/
    │   └── {userId}/
    ├── blogs/
    │   └── {blogId}/
    ├── projects/
    │   └── {projectId}/
    └── uploads/
```

## Features

### File Validation

- **File Types**: JPEG, JPG, PNG, WebP, GIF
- **File Size**: Maximum 5MB per file
- **Dimensions**: Automatic width/height detection

### Image Optimization

- **Resizing**: Automatic resizing to max dimensions (1920x1080)
- **Compression**: 80% quality JPEG compression
- **Format Preservation**: Maintains original format

### User Experience

- **Drag & Drop**: Intuitive file upload interface
- **Preview**: Real-time image preview
- **Progress**: Upload progress indication
- **Error Handling**: Clear error messages
- **Replace/Remove**: Easy image management

## Usage

### Basic Image Upload

```tsx
import { ImageUpload } from "@/components/ui/image-upload";
import { StorageService, UploadResult } from "@/lib/services/storage-service";

function MyComponent() {
  const handleUpload = (result: UploadResult) => {
    console.log("Uploaded:", result.url);
  };

  return (
    <ImageUpload
      onUpload={handleUpload}
      folder="projects"
      label="Upload Project Image"
      description="Drag and drop an image or click to select"
    />
  );
}
```

### Advanced Usage

```tsx
import { StorageService } from "@/lib/services/storage-service";

// Direct service usage
const uploadImage = async (file: File) => {
  try {
    const result = await StorageService.uploadProjectImage(
      file,
      "project-123",
      { alt: "Project screenshot" }
    );
    console.log("Upload successful:", result.url);
  } catch (error) {
    console.error("Upload failed:", error);
  }
};

// Optimized upload
const uploadOptimized = async (file: File) => {
  try {
    const result = await StorageService.optimizeImageUpload(
      file,
      "projects",
      1200, // max width
      800 // max height
    );
    console.log("Optimized upload:", result.url);
  } catch (error) {
    console.error("Optimization failed:", error);
  }
};
```

### API Route Usage

```typescript
// Client-side API call
const uploadViaAPI = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "projects");
  formData.append("metadata", JSON.stringify({ alt: "Project image" }));

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result;
};
```

## Configuration

### Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Supabase Storage Setup

1. **Create Storage Bucket**:

   ```sql
   -- In Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('images', 'images', true);
   ```

2. **Set Storage Policies**:

   ```sql
   -- Allow public read access
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'images');

   -- Allow authenticated uploads
   CREATE POLICY "Authenticated Uploads" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'images'
     AND auth.role() = 'authenticated'
   );

   -- Allow users to update their own uploads
   CREATE POLICY "User Updates" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'images'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow users to delete their own uploads
   CREATE POLICY "User Deletes" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'images'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## Integration Examples

### Project Form Integration

```tsx
// src/app/(admin)/admin/projects/new/page.tsx
const handleImageUpload = (result: UploadResult) => {
  setFormData((prev) => ({
    ...prev,
    featured_image: result.url,
  }));
};

<ImageUpload
  onUpload={handleImageUpload}
  onRemove={() => setFormData((prev) => ({ ...prev, featured_image: "" }))}
  currentImage={formData.featured_image}
  folder="projects"
  label="Upload Project Image"
  description="Drag and drop an image or click to select"
/>;
```

### Blog Post Integration

```tsx
// src/app/(admin)/admin/blogs/new/page.tsx
const handleImageUpload = (result: UploadResult) => {
  setFormData((prev) => ({
    ...prev,
    featured_image: result.url,
  }));
};

<ImageUpload
  onUpload={handleImageUpload}
  onRemove={() => setFormData((prev) => ({ ...prev, featured_image: "" }))}
  currentImage={formData.featured_image}
  folder="blogs"
  label="Upload Blog Image"
  description="Drag and drop an image or click to select"
/>;
```

## Error Handling

### Common Errors

1. **File Type Error**:

   ```
   Error: Only JPEG, PNG, WebP, and GIF files are allowed
   ```

2. **File Size Error**:

   ```
   Error: File size must be less than 5MB
   ```

3. **Upload Error**:
   ```
   Error: Upload failed: [Supabase error message]
   ```

### Error Recovery

```tsx
const handleUpload = async (file: File) => {
  try {
    const result = await StorageService.uploadImage(file, "uploads");
    // Handle success
  } catch (error) {
    if (error.message.includes("File size")) {
      // Show file size error
    } else if (error.message.includes("File type")) {
      // Show file type error
    } else {
      // Show generic error
    }
  }
};
```

## Performance Considerations

### Optimization Features

1. **Client-side Validation**: Prevents unnecessary uploads
2. **Image Compression**: Reduces file sizes
3. **Lazy Loading**: Images load only when needed
4. **Caching**: Browser and CDN caching

### Best Practices

1. **Use Appropriate Image Sizes**: Upload images at the size they'll be displayed
2. **Optimize Before Upload**: Compress images when possible
3. **Use WebP Format**: Better compression for web
4. **Implement Lazy Loading**: Load images as they come into view

## Security

### Validation Layers

1. **Client-side**: File type and size validation
2. **Server-side**: Additional validation in API routes
3. **Storage Policies**: Supabase RLS policies

### Access Control

- **Public Read**: Images are publicly accessible
- **Authenticated Upload**: Only authenticated users can upload
- **User-specific Folders**: Users can only manage their own uploads

## Troubleshooting

### Common Issues

1. **Upload Fails**:

   - Check Supabase credentials
   - Verify storage bucket exists
   - Check storage policies

2. **Images Not Loading**:

   - Verify public access policy
   - Check image URLs in database
   - Clear browser cache

3. **Permission Errors**:
   - Ensure user is authenticated
   - Check RLS policies
   - Verify folder permissions

### Debug Mode

Enable debug logging:

```typescript
// In development
const DEBUG = process.env.NODE_ENV === "development";

if (DEBUG) {
  console.log("Upload details:", { file, folder, metadata });
}
```

## Future Enhancements

### Planned Features

1. **Image Cropping**: Client-side image cropping tool
2. **Multiple Uploads**: Batch image upload support
3. **Image Transformations**: Automatic thumbnail generation
4. **CDN Integration**: Global CDN for faster loading
5. **AI Enhancement**: Automatic image optimization

### Extensibility

The system is designed to be easily extensible:

```typescript
// Custom upload handler
class CustomStorageService extends StorageService {
  static async uploadWithWatermark(file: File, folder: string) {
    // Add watermark logic
    const watermarkedFile = await this.addWatermark(file);
    return this.uploadImage(watermarkedFile, folder);
  }
}
```

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Check browser console for errors
4. Verify environment configuration

---

This image upload system provides a robust, user-friendly solution for managing images in your portfolio project. It's designed to be secure, performant, and easy to use while maintaining flexibility for future enhancements.
