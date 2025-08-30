// Tipos específicos para Cloudinary
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface CloudinaryError {
  error: {
    message: string;
    http_code: number;
  };
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}