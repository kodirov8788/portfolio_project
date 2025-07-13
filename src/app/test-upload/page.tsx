"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { StorageService, UploadResult } from "@/lib/services/storage-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function TestUploadPage() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleUpload = (result: UploadResult) => {
    setUploadResult(result);
    setError(null);
    console.log("Upload successful:", result);
  };

  const handleRemove = () => {
    setUploadResult(null);
    setError(null);
  };

  const testDirectUpload = async () => {
    setIsTesting(true);
    setError(null);

    try {
      // Create a test file
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText("Test", 30, 55);
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          const testFile = new File([blob], "test-image.png", {
            type: "image/png",
          });

          try {
            const result = await StorageService.uploadImage(testFile, "test");
            setUploadResult(result);
            console.log("Direct upload successful:", result);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            console.error("Direct upload failed:", err);
          }
        }
        setIsTesting(false);
      }, "image/png");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
      setIsTesting(false);
    }
  };

  const checkBucket = async () => {
    try {
      const supabase = createClient();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error("Bucket check failed:", error);
        setError(`Bucket check failed: ${error.message}`);
      } else {
        console.log("Available buckets:", buckets);
        const imagesBucket = buckets?.find(
          (bucket: { id: string }) => bucket.id === "images"
        );
        if (imagesBucket) {
          console.log("Images bucket found:", imagesBucket);
          setError(null);
          alert("Images bucket found! Upload should work now.");
        } else {
          setError("Images bucket not found. Please run the setup script.");
          alert(
            "Images bucket not found. Please run the setup script in Supabase SQL Editor."
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bucket check failed");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Image Upload Test</h1>
          <p className="text-gray-600">Test the image upload functionality</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setup Check</CardTitle>
            <CardDescription>
              First, check if the storage bucket is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={checkBucket} variant="outline">
                Check Storage Bucket
              </Button>
              <Button onClick={testDirectUpload} disabled={isTesting}>
                {isTesting ? "Testing..." : "Test Direct Upload"}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm font-medium">Error:</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                {error.includes("bucket") && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm font-medium">
                      To fix this:
                    </p>
                    <ol className="text-yellow-700 text-sm mt-1 list-decimal list-inside space-y-1">
                      <li>Go to your Supabase Dashboard</li>
                      <li>Navigate to SQL Editor</li>
                      <li>
                        Copy and paste the content from{" "}
                        <code>scripts/simple-storage-setup.sql</code>
                      </li>
                      <li>Run the script</li>
                      <li>Come back and test again</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {uploadResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">
                  ✅ Upload Successful!
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>URL:</strong> {uploadResult.url}
                  </p>
                  <p>
                    <strong>Path:</strong> {uploadResult.path}
                  </p>
                  <p>
                    <strong>Size:</strong> {uploadResult.size} bytes
                  </p>
                  <p>
                    <strong>Type:</strong> {uploadResult.type}
                  </p>
                </div>
                {uploadResult.url && (
                  <img
                    src={uploadResult.url}
                    alt="Uploaded test image"
                    className="mt-3 max-w-xs border rounded"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Test</CardTitle>
            <CardDescription>
              Test the ImageUpload component with drag and drop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onUpload={handleUpload}
              onRemove={handleRemove}
              currentImage={uploadResult?.url}
              folder="test"
              label="Test Image Upload"
              description="Try uploading an image to test the component"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              If you&apos;re getting &quot;Bucket not found&quot; errors, follow
              these steps:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">1. Open Supabase Dashboard</h4>
                <p className="text-sm text-gray-600">
                  Go to your Supabase project dashboard
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. Navigate to SQL Editor</h4>
                <p className="text-sm text-gray-600">
                  Click on &quot;SQL Editor&quot; in the left sidebar
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. Run Setup Script</h4>
                <p className="text-sm text-gray-600">
                  Copy and paste this SQL:
                </p>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {`-- Create the images bucket
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
);`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">4. Test Again</h4>
                <p className="text-sm text-gray-600">
                  Come back to this page and test the upload functionality
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
