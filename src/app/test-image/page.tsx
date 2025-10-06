'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { uploadRecipeImage } from '@/lib/imageUpload';
import { getCachedImageUrl } from '@/lib/imageCache';
import CachedImage from '@/components/CachedImage';

export default function TestImagePage() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.email) return;

    try {
      setUploading(true);
      const result = await uploadRecipeImage(file, 'test-recipe', session.user.email);
      setImagePath(result.imagePath);
      setImageUrl(result.imageUrl);
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error);
    } finally {
      setUploading(false);
    }
  };

  const testCache = async () => {
    if (imagePath) {
      const cachedUrl = await getCachedImageUrl(imagePath);
      console.log('Cached URL:', cachedUrl);
    }
  };

  if (!session) {
    return <div className="p-8">Please sign in to test image upload</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Upload Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Upload Test Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
        </div>

        {imagePath && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Image Path: {imagePath}</p>
              <p className="text-sm text-gray-500">Signed URL: {imageUrl}</p>
            </div>
            
            <button
              onClick={testCache}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Cache
            </button>

            <div>
              <h3 className="text-lg font-medium mb-2">Cached Image Component:</h3>
              <CachedImage
                imagePath={imagePath}
                alt="Test upload"
                width={400}
                height={400}
                className="w-64 h-64 object-cover rounded-lg border"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
