'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/modules/auth';
import { uploadImageToCloudinary, validateImageFile } from '@/lib/cloudinary';
import { 
  UserProfile, 
  ProfileFormData, 
  createUserProfileFromFirebaseUser,
  createFormDataFromProfile 
} from '@/types/firebaseUser';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre es demasiado largo'),
  photoURL: z.string().url().optional().or(z.literal('').or(z.null())),
});

interface ProfileFormProps {
  onProfileUpdated?: (profile: UserProfile) => void;
}

export default function ProfileForm({ onProfileUpdated }: ProfileFormProps) {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfile = currentUser ? createUserProfileFromFirebaseUser(currentUser) : null;
  const formData = currentUser ? createFormDataFromProfile(currentUser) : null;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: formData?.displayName || '',
      photoURL: formData?.photoURL || '',
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setMessage({ type: 'error', text: validation.error || 'Archivo inválido' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const result = await uploadImageToCloudinary(file);
      const optimizedUrl = result.secure_url;
      
      form.setValue('photoURL', optimizedUrl);
      setPreviewImage(optimizedUrl);
      setMessage({ type: 'success', text: 'Imagen subida exitosamente' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al subir la imagen' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'Usuario no autenticado' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile(currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
      });

      const updatedProfile = createUserProfileFromFirebaseUser(currentUser);
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar el perfil' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const currentPhotoURL = previewImage || form.watch('photoURL') || userProfile?.photoURL;
  const displayName = userProfile?.displayName || 'Usuario';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando perfil...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Upload Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Foto de Perfil</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentPhotoURL || undefined} alt={displayName} />
                  <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-1 -right-1 rounded-full h-8 w-8"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Haz clic en el ícono de cámara para cambiar tu foto
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG o GIF. Máximo 5MB.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Name Field */}
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingresa tu nombre completo" 
                    {...field} 
                    className="max-w-md"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex justify-start space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSaving || isUploading || !form.formState.isDirty}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setPreviewImage(null);
                setMessage(null);
              }}
              disabled={isSaving || isUploading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}