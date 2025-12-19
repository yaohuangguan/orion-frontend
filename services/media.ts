
import { fetchClient } from './core';
import { toast } from '../components/Toast';

// Helper to convert File to Base64 Data URI (Legacy/Raw)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper: Client-side Image Compression (Fallback)
export const compressImage = (file: File, quality = 0.7, maxWidth = 1600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          // Canvas context failed, fallback to raw base64
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

// Helper to upload to Cloudinary directly
const uploadToCloudinary = async (file: File): Promise<string> => {
  // 1. Get Public Config
  const config = await fetchClient<{cloudName: string, apiKey: string}>('/cloudinary/config');
  
  // 2. Get Secure Signature
  const signData = await fetchClient<{timestamp: number, signature: string}>('/cloudinary/signature');
  
  // 3. Construct FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', signData.timestamp.toString());
  formData.append('signature', signData.signature);
  
  // 4. Post to Cloudinary (Use native fetch to avoid adding app auth headers)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Cloudinary Upload Failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url;
};

// NEW: Helper to upload image (Public for components)
export const uploadImage = async (file: File): Promise<string> => {
  try {
    return await uploadToCloudinary(file);
  } catch (e) {
    console.warn('Cloudinary upload failed, falling back to compression:', e);
    try {
      const compressed = await compressImage(file);
      toast.info('Using local compression fallback.');
      return compressed;
    } catch (compressError) {
       return await fileToBase64(file);
    }
  }
};
