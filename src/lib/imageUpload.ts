export const uploadRecipeImage = async (
  file: File, 
  recipeId: string, 
  familyId: string
): Promise<{ imagePath: string; imageUrl: string }> => {
  try {
    const compressedFile = await compressImage(file);
    
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('recipeId', recipeId);
    formData.append('familyId', familyId);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }
    
    return result;
  } catch (error) {
    console.error('uploadRecipeImage error:', error);
    throw error;
  }
};

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      // Fixed 400x400 size
      canvas.width = 400;
      canvas.height = 400;
      
      // Maintain aspect ratio, center crop
      const aspectRatio = img.width / img.height;
      let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
      
      if (aspectRatio > 1) {
        // Landscape: crop width
        sourceWidth = img.height;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Portrait: crop height
        sourceHeight = img.width;
        sourceY = (img.height - sourceHeight) / 2;
      }
      
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 400, 400);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], `${Date.now()}.jpg`, { type: 'image/jpeg' }));
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, 'image/jpeg', 0.85);
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const getImageSignedUrl = async (imagePath: string, signal?: AbortSignal): Promise<string> => {
  try {
    const response = await fetch('/api/get-image-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imagePath }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Server-side signed URL error:', error);
      return '';
    }

    const { signedUrl } = await response.json();
    return signedUrl || '';
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Failed to get signed URL:', error);
    }
    return '';
  }
};
