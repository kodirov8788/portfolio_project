import { createClient } from "@/lib/supabase/client";

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  type: string;
}

export interface ImageMetadata {
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
}

export class StorageService {
  private static bucket = "images";
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  static setBucket(bucketName: string) {
    this.bucket = bucketName;
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: "File size must be less than 5MB" };
    }
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "Only JPEG, PNG, WebP, and GIF files are allowed",
      };
    }
    return { valid: true };
  }

  static async uploadImage(
    file: File,
    folder: string = "uploads",
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    const supabase = createClient();
    console.log("[StorageService] Using bucket:", this.bucket);
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Try to upload directly without checking bucket existence first
    const { error: uploadError } = await supabase.storage
      .from(this.bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          contentType: file.type,
          ...metadata,
        },
      });

    if (uploadError) {
      console.error("[StorageService] Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucket).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      filename: fileName,
      size: file.size,
      type: file.type,
    };
  }

  static async uploadProjectImage(
    file: File,
    projectId?: string,
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    const folder = projectId ? `projects/${projectId}` : "projects";
    return this.uploadImage(file, folder, metadata);
  }

  static async uploadBlogImage(
    file: File,
    blogId?: string,
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    const folder = blogId ? `blogs/${blogId}` : "blogs";
    return this.uploadImage(file, folder, metadata);
  }

  static async uploadAvatar(
    file: File,
    userId: string,
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    const folder = `avatars/${userId}`;
    return this.uploadImage(file, folder, metadata);
  }

  static async deleteImage(path: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.storage.from(this.bucket).remove([path]);
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  static async getImageUrl(path: string): Promise<string> {
    const supabase = createClient();
    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucket).getPublicUrl(path);
    return publicUrl;
  }

  static async listImages(folder: string = "uploads"): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .list(folder);
    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }
    return data?.map((file: { name: string }) => file.name) || [];
  }

  static getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  static async optimizeImageUpload(
    file: File,
    folder: string,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<UploadResult> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            try {
              const result = await this.uploadImage(optimizedFile, folder);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          file.type,
          0.8
        );
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    return { width: Math.round(width), height: Math.round(height) };
  }
}

// Simple uploadFile function using the current supabase client and current bucket
export async function uploadFile(
  file: File,
  filePath: string
): Promise<{ data: unknown; error: unknown }> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(StorageService["bucket"])
    .upload(filePath, file);
  if (error) {
    console.error("[uploadFile] Upload error:", error);
    return { data: null, error };
  } else {
    console.log("[uploadFile] Upload success:", data);
    return { data, error: null };
  }
}
