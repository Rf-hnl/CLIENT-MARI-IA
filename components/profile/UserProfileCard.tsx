'use client';

import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
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
  Upload
} from 'lucide-react';
import { 
  FirebaseUserRecord, 
  ProfileUpdateData, 
  ProfileUpdateResult,
  createFirebaseUserRecord,
  getPrimaryProvider,
  getProviderInfo
} from '@/types/firebaseUser';
import { formatDate } from '@/utils/dateFormat';
import { uploadImageToCloudinary, validateImageFile } from '@/lib/cloudinary';

interface UserProfileCardProps {
  user: User;
  onProfileUpdate?: (result: ProfileUpdateResult) => void;
}

export default function UserProfileCard({ user, onProfileUpdate }: UserProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [userRecord, setUserRecord] = useState<FirebaseUserRecord>(() => createFirebaseUserRecord(user));
  const [editedDisplayName, setEditedDisplayName] = useState(user.displayName || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const primaryProvider = getPrimaryProvider(userRecord);
  const providerInfo = getProviderInfo(primaryProvider);
  
  // Actualizar userRecord cuando el user cambie
  React.useEffect(() => {
    setUserRecord(createFirebaseUserRecord(user));
    setEditedDisplayName(user.displayName || '');
    setPreviewImage(null);
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
      const result = await uploadImageToCloudinary(file);
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
  const handleProfileUpdate = async (): Promise<ProfileUpdateResult> => {
    setIsUpdating(true);
    
    try {
      const updatedFields: string[] = [];
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      // Preparar datos para actualizar
      if (editedDisplayName !== user.displayName) {
        updateData.displayName = editedDisplayName;
        updatedFields.push('displayName');
      }
      
      if (previewImage && previewImage !== user.photoURL) {
        updateData.photoURL = previewImage;
        updatedFields.push('photoURL');
      }
      
      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length > 0) {
        await updateProfile(user, {
          displayName: updateData.displayName || user.displayName,
          photoURL: updateData.photoURL || user.photoURL
        });
      }
      
      // Recargar el usuario para obtener los datos actualizados
      await user.reload();
      
      // Crear el usuario actualizado para devolver
      const updatedUserRecord = createFirebaseUserRecord(user);
      
      // Actualizar el estado local para reflejar los cambios inmediatamente
      setUserRecord(updatedUserRecord);
      
      // Limpiar estados de edición
      setPreviewImage(null);
      setUploadMessage(null);
      
      const result: ProfileUpdateResult = {
        success: true,
        message: updatedFields.length > 0 
          ? `Perfil actualizado exitosamente. Campos modificados: ${updatedFields.join(', ')}`
          : 'No se detectaron cambios en el perfil',
        updatedFields,
        updatedProfile: updatedUserRecord
      };
      
      if (onProfileUpdate) {
        onProfileUpdate(result);
      }
      
      setIsEditing(false);
      return result;
      
    } catch (error) {
      const result: ProfileUpdateResult = {
        success: false,
        message: 'Error al actualizar el perfil',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      
      if (onProfileUpdate) {
        onProfileUpdate(result);
      }
      
      return result;
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
                    <AvatarImage src={previewImage || userRecord.photoURL || undefined} alt={userRecord.displayName || 'Usuario'} />
                    <AvatarFallback className="text-lg">
                      {getInitials(userRecord.displayName, userRecord.email)}
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
                    Guardar cambios
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
                <AvatarImage src={userRecord.photoURL || undefined} alt={userRecord.displayName || 'Usuario'} />
                <AvatarFallback className="text-lg">
                  {getInitials(userRecord.displayName, userRecord.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-xl font-semibold">
                    {userRecord.displayName || 'Sin nombre configurado'}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {userRecord.email || 'Sin email'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={userRecord.emailVerified ? "default" : "secondary"} className="flex items-center gap-1">
                    {userRecord.emailVerified ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {userRecord.emailVerified ? 'Verificado' : 'Sin verificar'}
                  </Badge>
                  
                  <Badge variant={userRecord.disabled ? "destructive" : "outline"} className="flex items-center gap-1">
                    {userRecord.disabled ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {userRecord.disabled ? 'Deshabilitado' : 'Activo'}
                  </Badge>
                  
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>{providerInfo.icon}</span>
                    {providerInfo.name}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información Detallada Completa */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Información de Identidad */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Identidad
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">UID Completo:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                      {userRecord.uid}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="break-all">{userRecord.email || 'No configurado'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email Verificado:</span>
                    <Badge variant={userRecord.emailVerified ? "default" : "secondary"}>
                      {userRecord.emailVerified ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span>{userRecord.displayName || 'No configurado'}</span>
                  </div>
                  
                  {userRecord.phoneNumber && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Teléfono:
                      </span>
                      <span>{userRecord.phoneNumber}</span>
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
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={userRecord.disabled ? "destructive" : "default"}>
                      {userRecord.disabled ? 'Deshabilitado' : 'Activo'}
                    </Badge>
                  </div>
                  
                  
                  {userRecord.tokensValidAfterTime && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Tokens válidos desde:</span>
                      <span className="text-xs">{formatDate(userRecord.tokensValidAfterTime)}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Archivo de Foto:</span>
                    {userRecord.photoURL ? (
                      <a 
                        href={userRecord.photoURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                        title={userRecord.photoURL}
                      >
                        {userRecord.photoURL.split('/').pop() || 'imagen.jpg'}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No configurada</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Temporal */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Cronología
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Cuenta creada:
                    </span>
                    <span className="text-xs">
                      {formatDate(userRecord.metadata.creationTime)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Último acceso:
                    </span>
                    <span className="text-xs">
                      {formatDate(userRecord.metadata.lastSignInTime)}
                    </span>
                  </div>
                  
                  {userRecord.metadata.lastRefreshTime && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Último refresh:</span>
                      <span className="text-xs">
                        {formatDate(userRecord.metadata.lastRefreshTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Proveedores de Autenticación */}
            {userRecord.providerData.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Métodos de Autenticación ({userRecord.providerData.length})
                  </h4>
                  
                  <div className="grid gap-4">
                    {userRecord.providerData.map((provider, index) => {
                      const providerInfo = getProviderInfo(provider.providerId);
                      return (
                        <div key={index} className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{providerInfo.icon}</span>
                              <div>
                                <p className="font-semibold">{providerInfo.name}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {provider.providerId}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {provider.uid && (
                              <div>
                                <span className="text-muted-foreground">UID del Proveedor:</span>
                                <p className="font-mono text-xs bg-background px-2 py-1 rounded mt-1 break-all">
                                  {provider.uid}
                                </p>
                              </div>
                            )}
                            
                            {provider.email && (
                              <div>
                                <span className="text-muted-foreground">Email del Proveedor:</span>
                                <p className="mt-1 break-all">{provider.email}</p>
                              </div>
                            )}
                            
                            {provider.displayName && (
                              <div>
                                <span className="text-muted-foreground">Nombre del Proveedor:</span>
                                <p className="mt-1">{provider.displayName}</p>
                              </div>
                            )}
                            
                            {provider.phoneNumber && (
                              <div>
                                <span className="text-muted-foreground">Teléfono del Proveedor:</span>
                                <p className="mt-1">{provider.phoneNumber}</p>
                              </div>
                            )}
                            
                            {provider.photoURL && (
                              <div className="md:col-span-2">
                                <span className="text-muted-foreground">Foto del Proveedor:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <img 
                                    src={provider.photoURL} 
                                    alt="Avatar del proveedor"
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <a 
                                    href={provider.photoURL} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                    title={provider.photoURL}
                                  >
                                    {provider.photoURL.split('/').pop() || 'imagen.jpg'}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Claims Personalizados */}
            {userRecord.customClaims && Object.keys(userRecord.customClaims).length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Claims Personalizados ({Object.keys(userRecord.customClaims).length})
                  </h4>
                  
                  <div className="space-y-3">
                    {Object.entries(userRecord.customClaims).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <span className="font-medium text-sm">{key}</span>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {typeof value}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-1 text-right">
                            <span className="text-sm break-all">
                              {value !== null ? String(value) : 'null'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Ver JSON completo
                      </summary>
                      <div className="bg-muted/50 p-3 rounded-lg mt-2">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(userRecord.customClaims, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </div>
              </>
            )}

            {/* Resumen de Datos Completos */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Objeto Firebase Completo
              </h4>
              
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Ver datos JSON completos del usuario
                </summary>
                <div className="bg-muted/50 p-4 rounded-lg mt-3 max-h-96 overflow-y-auto">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(userRecord, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}