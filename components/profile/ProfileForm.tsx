'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
} from '@/types/authProfile';
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
  const formData = userProfile ? createFormDataFromProfile(userProfile) : null;

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Gestión de Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentPhotoURL || undefined} alt={displayName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -bottom-2 -right-2 rounded-full"
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground text-center">
            Haz clic en el ícono de cámara para cambiar tu foto de perfil
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input
                  value={userProfile.email || 'No disponible'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede modificar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Estado de verificación</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${userProfile.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span>{userProfile.emailVerified ? 'Verificado' : 'Pendiente de verificación'}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Miembro desde</Label>
                <p className="mt-1">
                  {userProfile.creationTime 
                    ? new Date(userProfile.creationTime).toLocaleDateString('es-ES')
                    : 'No disponible'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
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
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}