import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = generateReactHelpers<OurFileRouter>();

export interface ImageUploadResult {
  secure_url: string;
  public_id: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validar archivo de imagen
export function validateImageFile(file: File): ValidationResult {
  // Verificar que sea un archivo
  if (!file) {
    return { isValid: false, error: 'No se seleccionó ningún archivo' };
  }

  // Verificar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Tipo de archivo no válido. Solo se permiten: JPG, PNG, GIF, WEBP' 
    };
  }

  // Verificar tamaño (2MB máximo)
  const maxSize = 2 * 1024 * 1024; // 2MB en bytes
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: 'El archivo es demasiado grande. Máximo 2MB permitido' 
    };
  }

  return { isValid: true };
}

// Función para subir imagen a UploadThing (simula la interfaz de Cloudinary)
export async function uploadImageToUploadThing(file: File): Promise<ImageUploadResult> {
  try {
    // Obtener token de autorización del almacenamiento local
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    // Usar el helper de UploadThing para subir archivo
    const result = await uploadFiles("userAvatar", {
      files: [file],
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Verificar que la subida fue exitosa
    if (result && result[0] && result[0].url) {
      return {
        secure_url: result[0].url,
        public_id: result[0].key || result[0].name || 'unknown'
      };
    }

    throw new Error('Error al subir el archivo');

  } catch (error) {
    console.error('❌ [UPLOADTHING] Error uploading image:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error desconocido al subir la imagen');
  }
}