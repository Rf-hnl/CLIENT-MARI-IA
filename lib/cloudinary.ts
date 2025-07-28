import { CloudinaryUploadResult, CloudinaryError } from '@/types/authProfile';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export const getCloudinaryConfig = (): CloudinaryConfig => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary configuration is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variables.'
    );
  }

  return {
    cloudName,
    uploadPreset,
  };
};

export const uploadImageToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  try {
    const config = getCloudinaryConfig();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', 'user-profiles');
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: CloudinaryError = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result: CloudinaryUploadResult = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
    throw new Error('Cloudinary upload failed: Unknown error');
  }
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de archivo no válido. Solo se permiten: JPEG, PNG, WebP, GIF',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'El archivo es demasiado grande. Máximo 5MB permitido',
    };
  }

  return { isValid: true };
};

export const generateOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'png' | 'jpg';
  } = {}
): string => {
  const config = getCloudinaryConfig();
  const { width = 400, height = 400, quality = 80, format = 'auto' } = options;

  return `https://res.cloudinary.com/${config.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
};