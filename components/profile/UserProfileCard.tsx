'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Edit, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  Camera,
  Loader2,
  AlertCircle,
  Upload,
  RefreshCw,
  AlertTriangle,
  Database,
  Building2
} from 'lucide-react';
import { User } from '@/types/user';
import { useAuth } from '@/modules/auth';
import { uploadImageToUploadThing, validateImageFile } from '@/lib/uploadthing-helpers';
import { formatDate } from '@/utils/dateFormat';

interface UserProfileCardProps {
  user: User;
  onProfileUpdate?: (success: boolean, message: string) => void;
}

export default function UserProfileCard({ user, onProfileUpdate }: UserProfileCardProps) {
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState(user.displayName || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when user prop changes
  useEffect(() => {
    setEditedDisplayName(user.displayName || '');
    setPreviewImage(null);
    setUploadMessage(null);
  }, [user]);
  

  // Función para manejar la subida de imagen
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setUploadMessage({ type: 'error', text: validation.error || 'Archivo inválido' });
      return;
    }

    setIsUploadingImage(true);
    setUploadMessage(null);

    try {
      const result = await uploadImageToUploadThing(file);
      const optimizedUrl = result.secure_url;
      
      setPreviewImage(optimizedUrl);
      setUploadMessage({ type: 'success', text: 'Imagen subida exitosamente' });
    } catch (error) {
      setUploadMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al subir la imagen' 
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Función para activar el selector de archivos
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Función para actualizar el perfil del usuario
  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    
    try {
      const updateData: { displayName?: string; avatarUrl?: string } = {};
      
      // Preparar datos para actualizar
      if (editedDisplayName !== user.displayName) {
        updateData.displayName = editedDisplayName;
      }
      
      if (previewImage && previewImage !== user.avatarUrl) {
        updateData.avatarUrl = previewImage;
      }
      
      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length > 0) {
        const result = await updateProfile(updateData);
        
        if (result.error) {
          setUploadMessage({ type: 'error', text: result.error });
          
          if (onProfileUpdate) {
            onProfileUpdate(false, result.error);
          }
        } else {
          setUploadMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
          setIsEditing(false);
          setPreviewImage(null);
          
          if (onProfileUpdate) {
            onProfileUpdate(true, 'Perfil actualizado exitosamente');
          }
        }
      } else {
        setUploadMessage({ type: 'success', text: 'No se detectaron cambios en el perfil' });
        setIsEditing(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setUploadMessage({ type: 'error', text: errorMessage });
      
      if (onProfileUpdate) {
        onProfileUpdate(false, errorMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Perfil de Usuario
          </CardTitle>
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <EyeOff className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Editar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">

        {isEditing ? (
          <div className="space-y-6">
            {/* Mensajes de estado */}
            {uploadMessage && (
              <Alert className={uploadMessage.type === 'error' ? 'border-red-500' : 'border-green-500'}>
                {uploadMessage.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription className={uploadMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                  {uploadMessage.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Edición de foto de perfil */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Foto de Perfil</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={previewImage || user.avatarUrl || undefined} alt={user.displayName || 'Usuario'} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.displayName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
                    onClick={triggerFileInput}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
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
                  {previewImage && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Nueva imagen lista para guardar
                    </p>
                  )}
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

            {/* Edición de nombre */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Nombre completo
              </Label>
              <Input
                id="displayName"
                value={editedDisplayName}
                onChange={(e) => setEditedDisplayName(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                className="max-w-md"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-start space-x-3 pt-4">
              <Button 
                onClick={handleProfileUpdate}
                disabled={isUpdating || isUploadingImage}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Guardar Perfil
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedDisplayName(user.displayName || '');
                  setPreviewImage(null);
                  setUploadMessage(null);
                }}
                disabled={isUpdating || isUploadingImage}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Información Principal */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || 'Usuario'} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.displayName, user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-xl font-semibold">
                    {user.displayName || 'Sin nombre configurado'}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email || 'Sin email'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={user.emailVerified ? "default" : "secondary"} className="flex items-center gap-1">
                    {user.emailVerified ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {user.emailVerified ? 'Verificado' : 'Sin verificar'}
                  </Badge>
                  
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información Detallada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de Identidad */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Información Personal
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">ID de Usuario:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                      {user.id}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="break-all">{user.email}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email Verificado:</span>
                    <Badge variant={user.emailVerified ? "default" : "secondary"}>
                      {user.emailVerified ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span>{user.displayName || 'No configurado'}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Teléfono:
                      </span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Sistema
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rol:</span>
                    <Badge variant="default">
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Cuenta creada:
                    </span>
                    <span className="text-xs">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Último acceso:
                    </span>
                    <span className="text-xs">
                      {user.lastSignIn ? formatDate(user.lastSignIn) : 'Nunca'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total de accesos:</span>
                    <Badge variant="outline">
                      {user.signInCount}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}