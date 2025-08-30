"use client";

import { useState } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  endpoint: 'organizationLogo' | 'organizationCover';
  title: string;
  description: string;
  maxSize?: string;
}

export function ImageUpload({
  value,
  onChange,
  endpoint,
  title,
  description,
  maxSize = "2MB"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleRemove = () => {
    onChange('');
    toast.success("Imagen eliminada correctamente");
  };

  if (value) {
    return (
      <Card className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">{title}</h4>
          <Button
            onClick={handleRemove}
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={value}
            alt={title}
            fill
            className="object-contain"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {description}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="h-4 w-4" />
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {description} (Máximo {maxSize})
      </p>
      
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          if (res?.[0]?.url) {
            onChange(res[0].url);
            toast.success("¡Imagen subida exitosamente!", {
              description: `${title} ha sido actualizada`,
            });
          }
          setUploading(false);
        }}
        onUploadError={(error: Error) => {
          toast.error("Error al subir imagen", {
            description: error.message,
          });
          setUploading(false);
        }}
        onUploadBegin={() => {
          setUploading(true);
        }}
        config={{
          mode: "manual",
        }}
        appearance={{
          container: "border-2 border-dashed border-gray-300 rounded-lg p-6",
          uploadIcon: "text-gray-400 mb-2",
          label: "text-sm font-medium text-gray-600",
          allowedContent: "text-xs text-gray-500",
        }}
      />
      
      {uploading && (
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-bounce" />
            Subiendo imagen...
          </div>
        </div>
      )}
    </Card>
  );
}