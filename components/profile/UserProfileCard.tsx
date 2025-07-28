'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Upload,
  RefreshCw,
  AlertTriangle,
  Database,
  Building2
} from 'lucide-react';
import { 
  FirebaseUserRecord, 
  ProfileUpdateData, 
  ProfileUpdateResult,
  createFirebaseUserRecord,
  getPrimaryProvider,
  getProviderInfo
} from '@/types/firebaseUser';
import { 
  CombinedUserData,
  UidVerificationResult,
  FirestoreUser,
  UserEditFormData,
  UserUpdateResult,
  createUserEditFormData,
  createUpdateDataFromForm
} from '@/types/firestoreUser';
import { 
  getCombinedUserData,
  synchronizeUserUid,
  ensureFirestoreUser,
  updateUserFromForm
} from '@/lib/firestore/userService';
import { formatDate, safeFormatDate } from '@/utils/dateFormat';
import { uploadImageToCloudinary, validateImageFile } from '@/lib/cloudinary';
import { 
  validateUserEditForm, 
  ValidationErrors, 
  getFieldError, 
  hasFormErrors,
  sanitizeUserFormData,
  validateField 
} from '@/lib/validations/userValidation';
import { getCurrentUserData, getCurrentOrganization, getCurrentTenant } from '@/lib/auth/userState';

interface UserProfileCardProps {
  user: User;
  onProfileUpdate?: (result: ProfileUpdateResult) => void;
}

export default function UserProfileCard({ user, onProfileUpdate }: UserProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSyncingUid, setIsSyncingUid] = useState(false);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);
  const [userRecord, setUserRecord] = useState<FirebaseUserRecord>(() => createFirebaseUserRecord(user));
  const [combinedUserData, setCombinedUserData] = useState<CombinedUserData | null>(null);
  const [editedDisplayName, setEditedDisplayName] = useState(user.displayName || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [firestoreFormData, setFirestoreFormData] = useState<UserEditFormData | null>(null);
  const [isUpdatingFirestore, setIsUpdatingFirestore] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Global state hooks
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      Promise.all([
        getCurrentUserData(user),
        getCurrentOrganization(user),
        getCurrentTenant(user)
      ]).then(([data, org, tenant]) => {
        setUserData(data);
        setCurrentOrganization(org);
        setCurrentTenant(tenant);
      });
    }
  }, [user]);
  
  const primaryProvider = getPrimaryProvider(userRecord);
  const providerInfo = getProviderInfo(primaryProvider);
  
  // Load combined user data from Firestore
  const loadCombinedUserData = async () => {
    try {
      setIsLoadingFirestore(true);
      const combined = await getCombinedUserData(userRecord);
      setCombinedUserData(combined);
      
      // Initialize Firestore form data if user exists
      if (combined.firestoreUser) {
        const formData = createUserEditFormData(combined.firestoreUser);
        setFirestoreFormData(formData);
      }
    } catch (error) {
      console.error('Error loading combined user data:', error);
      // Set a fallback combined data structure
      setCombinedUserData({
        firebaseAuth: userRecord,
        firestoreUser: null,
        uidVerification: {
          isMatching: false,
          firebaseAuthUid: userRecord.uid,
          firestoreUid: null,
          requiresSync: true,
          message: 'Error al cargar datos de Firestore'
        }
      });
      setFirestoreFormData(null);
    } finally {
      setIsLoadingFirestore(false);
    }
  };

  // Synchronize UID between Firebase Auth and Firestore
  const handleUidSync = async () => {
    if (!combinedUserData?.firestoreUser) return;
    
    try {
      setIsSyncingUid(true);
      await synchronizeUserUid(userRecord.uid, combinedUserData.firestoreUser);
      // Reload combined data to reflect changes
      await loadCombinedUserData();
      setUploadMessage({ type: 'success', text: 'UID sincronizado exitosamente' });
    } catch (error) {
      setUploadMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al sincronizar UID' 
      });
    } finally {
      setIsSyncingUid(false);
    }
  };

  // Create Firestore user if it doesn't exist
  const handleCreateFirestoreUser = async () => {
    try {
      setIsSyncingUid(true);
      await ensureFirestoreUser(userRecord);
      await loadCombinedUserData();
      setUploadMessage({ type: 'success', text: 'Usuario creado en Firestore exitosamente' });
    } catch (error) {
      setUploadMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al crear usuario en Firestore' 
      });
    } finally {
      setIsSyncingUid(false);
    }
  };

  // Update Firestore user data
  const handleFirestoreUpdate = async () => {
    if (!combinedUserData?.firestoreUser || !firestoreFormData) return;
    
    try {
      setIsUpdatingFirestore(true);
      
      // Validate form data before updating
      const sanitizedData = sanitizeUserFormData(firestoreFormData);
      const validation = validateUserEditForm(sanitizedData);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setUploadMessage({ 
          type: 'error', 
          text: 'Por favor corrige los errores en el formulario antes de guardar' 
        });
        return;
      }
      
      // Clear validation errors
      setValidationErrors({});
      
      const result = await updateUserFromForm(userRecord.uid, validation.data!);
      
      if (result.success) {
        // Reload combined data to reflect changes
        await loadCombinedUserData();
        setUploadMessage({ type: 'success', text: result.message });
      } else {
        setUploadMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setUploadMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar datos de Firestore' 
      });
    } finally {
      setIsUpdatingFirestore(false);
    }
  };

  // Handle Firestore form field changes
  const handleFirestoreFieldChange = (field: keyof UserEditFormData, value: any) => {
    if (!firestoreFormData) return;
    
    // Update form data
    const updatedFormData = {
      ...firestoreFormData,
      [field]: value
    };
    setFirestoreFormData(updatedFormData);
    
    // Validate field in real-time
    const fieldError = validateField(field, value);
    setValidationErrors(prev => {
      const updated = { ...prev };
      if (fieldError) {
        updated[field] = [fieldError];
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  // Actualizar userRecord cuando el user cambie
  useEffect(() => {
    const newUserRecord = createFirebaseUserRecord(user);
    setUserRecord(newUserRecord);
    setEditedDisplayName(user.displayName || '');
    setPreviewImage(null);
    
    // Load combined data when user changes
    loadCombinedUserData();
  }, [user]);

  // Initial load
  useEffect(() => {
    loadCombinedUserData();
  }, []);

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

  // Helper component for field errors
  const FieldError = ({ field }: { field: string }) => {
    const error = getFieldError(validationErrors, field);
    if (!error) return null;
    
    return (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    );
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
        {/* UID Verification Alert */}
        {combinedUserData && !combinedUserData.uidVerification.isMatching && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-2">
                <p className="font-medium">¡Advertencia de sincronización de UID!</p>
                <p className="text-sm">{combinedUserData.uidVerification.message}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span>Firebase Auth UID:</span>
                  <code className="bg-yellow-100 px-1 rounded">{combinedUserData.uidVerification.firebaseAuthUid}</code>
                </div>
                {combinedUserData.uidVerification.firestoreUid && (
                  <div className="flex items-center gap-2 text-xs">
                    <span>Firestore UID:</span>
                    <code className="bg-yellow-100 px-1 rounded">{combinedUserData.uidVerification.firestoreUid}</code>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  {combinedUserData.firestoreUser ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUidSync}
                      disabled={isSyncingUid}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      {isSyncingUid ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sincronizar UID
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateFirestoreUser}
                      disabled={isSyncingUid}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      {isSyncingUid ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Database className="h-3 w-3 mr-1" />
                          Crear en Firestore
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Firestore Data */}
        {isLoadingFirestore && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Cargando datos de Firestore...
            </AlertDescription>
          </Alert>
        )}

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

            {/* Edición de nombre Firebase Auth */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Nombre completo (Firebase Auth)
              </Label>
              <Input
                id="displayName"
                value={editedDisplayName}
                onChange={(e) => setEditedDisplayName(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                className="max-w-md"
              />
            </div>

            {/* Formulario de edición de Firestore */}
            {combinedUserData?.firestoreUser && firestoreFormData && (
              <>
                <Separator />
                <div className="space-y-6">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Información de Firestore (Editable)
                  </h4>

                  {/* Información personal de Firestore */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firestoreDisplayName" className="text-sm font-medium">
                        Nombre completo
                      </Label>
                      <Input
                        id="firestoreDisplayName"
                        value={firestoreFormData.displayName}
                        onChange={(e) => handleFirestoreFieldChange('displayName', e.target.value)}
                        placeholder="Nombre completo"
                        className={getFieldError(validationErrors, 'displayName') ? 'border-red-500' : ''}
                      />
                      <FieldError field="displayName" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firestorePhone" className="text-sm font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="firestorePhone"
                        value={firestoreFormData.phoneNumber}
                        onChange={(e) => handleFirestoreFieldChange('phoneNumber', e.target.value)}
                        placeholder="Número de teléfono"
                        className={getFieldError(validationErrors, 'phoneNumber') ? 'border-red-500' : ''}
                      />
                      <FieldError field="phoneNumber" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        Nombre
                      </Label>
                      <Input
                        id="firstName"
                        value={firestoreFormData.firstName}
                        onChange={(e) => handleFirestoreFieldChange('firstName', e.target.value)}
                        placeholder="Nombre"
                        className={getFieldError(validationErrors, 'firstName') ? 'border-red-500' : ''}
                      />
                      <FieldError field="firstName" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Apellido
                      </Label>
                      <Input
                        id="lastName"
                        value={firestoreFormData.lastName}
                        onChange={(e) => handleFirestoreFieldChange('lastName', e.target.value)}
                        placeholder="Apellido"
                        className={getFieldError(validationErrors, 'lastName') ? 'border-red-500' : ''}
                      />
                      <FieldError field="lastName" />
                    </div>
                  </div>

                  {/* Información profesional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-sm font-medium">
                        Puesto
                      </Label>
                      <Input
                        id="position"
                        value={firestoreFormData.position}
                        onChange={(e) => handleFirestoreFieldChange('position', e.target.value)}
                        placeholder="Puesto de trabajo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium">
                        Departamento
                      </Label>
                      <Input
                        id="department"
                        value={firestoreFormData.department}
                        onChange={(e) => handleFirestoreFieldChange('department', e.target.value)}
                        placeholder="Departamento"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">
                        Ubicación
                      </Label>
                      <Input
                        id="location"
                        value={firestoreFormData.location}
                        onChange={(e) => handleFirestoreFieldChange('location', e.target.value)}
                        placeholder="Ubicación"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-medium">
                        Idioma
                      </Label>
                      <select
                        id="language"
                        value={firestoreFormData.language}
                        onChange={(e) => handleFirestoreFieldChange('language', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                  </div>

                  {/* Biografía */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Biografía
                    </Label>
                    <textarea
                      id="bio"
                      value={firestoreFormData.bio}
                      onChange={(e) => handleFirestoreFieldChange('bio', e.target.value)}
                      placeholder="Información adicional sobre ti..."
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* Preferencias */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm">Preferencias</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme" className="text-sm font-medium">
                          Tema
                        </Label>
                        <select
                          id="theme"
                          value={firestoreFormData.theme}
                          onChange={(e) => handleFirestoreFieldChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="system">Sistema</option>
                          <option value="light">Claro</option>
                          <option value="dark">Oscuro</option>
                        </select>
                      </div>
                    </div>

                    {/* Notificaciones */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Notificaciones</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="notificationEmail"
                            checked={firestoreFormData.notificationEmail}
                            onChange={(e) => handleFirestoreFieldChange('notificationEmail', e.target.checked)}
                            className="h-4 w-4 rounded border border-input bg-background"
                          />
                          <Label htmlFor="notificationEmail" className="text-sm">
                            Notificaciones por email
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="notificationPush"
                            checked={firestoreFormData.notificationPush}
                            onChange={(e) => handleFirestoreFieldChange('notificationPush', e.target.checked)}
                            className="h-4 w-4 rounded border border-input bg-background"
                          />
                          <Label htmlFor="notificationPush" className="text-sm">
                            Notificaciones push
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="notificationSms"
                            checked={firestoreFormData.notificationSms}
                            onChange={(e) => handleFirestoreFieldChange('notificationSms', e.target.checked)}
                            className="h-4 w-4 rounded border border-input bg-background"
                          />
                          <Label htmlFor="notificationSms" className="text-sm">
                            Notificaciones SMS
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Botones de acción */}
            <div className="flex justify-start space-x-3 pt-4">
              <Button 
                onClick={handleProfileUpdate}
                disabled={isUpdating || isUploadingImage || isUpdatingFirestore}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando Firebase Auth...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Guardar Firebase Auth
                  </>
                )}
              </Button>
              
              {combinedUserData?.firestoreUser && firestoreFormData && (
                <Button 
                  onClick={handleFirestoreUpdate}
                  disabled={
                    isUpdating || 
                    isUploadingImage || 
                    isUpdatingFirestore || 
                    hasFormErrors(validationErrors)
                  }
                  variant="secondary"
                >
                  {isUpdatingFirestore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando Firestore...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Guardar Firestore
                      {hasFormErrors(validationErrors) && (
                        <AlertCircle className="ml-1 h-3 w-3 text-red-500" />
                      )}
                    </>
                  )}
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedDisplayName(user.displayName || '');
                  setPreviewImage(null);
                  setUploadMessage(null);
                  setValidationErrors({});
                  // Reset Firestore form data
                  if (combinedUserData?.firestoreUser) {
                    const formData = createUserEditFormData(combinedUserData.firestoreUser);
                    setFirestoreFormData(formData);
                  }
                }}
                disabled={isUpdating || isUploadingImage || isUpdatingFirestore}
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

            {/* Contexto Organizacional Actual */}
            {(currentOrganization || currentTenant) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Contexto Actual
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Organización Actual */}
                    {currentOrganization && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Organización Activa</h5>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {currentOrganization.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{currentOrganization.name}</p>
                              <p className="text-sm text-muted-foreground">{currentOrganization.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {currentOrganization.memberIds.length} miembros
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {currentOrganization.stats.totalLeads} leads
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Tenant Actual */}
                    {currentTenant && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Empresa Activa</h5>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-2">
                            <p className="font-medium">{currentTenant.companyInfo.name}</p>
                            <p className="text-sm text-muted-foreground">{currentTenant.companyInfo.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                {currentTenant.planType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {currentTenant.companyInfo.industry}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selector de Organización */}
                  {userData?.availableOrganizations?.length > 1 && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Cambiar Organización</h5>
                      <p className="text-sm text-muted-foreground">
                        Organización actual: {currentOrganization?.name || 'No seleccionada'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Información de Firestore */}
            {combinedUserData?.firestoreUser && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Información de Firestore
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Contexto Organizacional */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-sm">Contexto Organizacional</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Tenant Actual:</span>
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {combinedUserData.firestoreUser.currentTenantId || 'No asignado'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Organización Actual:</span>
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {combinedUserData.firestoreUser.currentOrganizationId || 'No asignado'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Organizaciones:</span>
                          <Badge variant="outline">
                            {combinedUserData.firestoreUser.totalOrganizations}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Tenants:</span>
                          <Badge variant="outline">
                            {combinedUserData.firestoreUser.totalTenants}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Roles y Permisos */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-sm">Roles y Estado</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Rol:</span>
                          <Badge variant="default">
                            {combinedUserData.firestoreUser.role}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Rol del Sistema:</span>
                          <Badge variant={combinedUserData.firestoreUser.systemRole === 'admin' ? 'destructive' : 'secondary'}>
                            {combinedUserData.firestoreUser.systemRole}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Perfil Completo:</span>
                          <Badge variant={combinedUserData.firestoreUser.profileCompleted ? 'default' : 'secondary'}>
                            {combinedUserData.firestoreUser.profileCompleted ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">En Línea:</span>
                          <Badge variant={combinedUserData.firestoreUser.isOnline ? 'default' : 'secondary'}>
                            {combinedUserData.firestoreUser.isOnline ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actividad */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-sm">Actividad</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Última Actividad:</span>
                          <span className="text-xs">
                            {safeFormatDate(combinedUserData.firestoreUser.lastActivity)}
                          </span>
                        </div>
                        
                        {combinedUserData.firestoreUser.lastLoginAt && (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Último Login:</span>
                            <span className="text-xs">
                              {safeFormatDate(combinedUserData.firestoreUser.lastLoginAt)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Logins Totales:</span>
                          <Badge variant="outline">
                            {combinedUserData.firestoreUser.loginCount}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Resumen de Datos Completos */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Datos Completos
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Ver datos Firebase Auth completos
                  </summary>
                  <div className="bg-muted/50 p-4 rounded-lg mt-3 max-h-96 overflow-y-auto">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(userRecord, null, 2)}
                    </pre>
                  </div>
                </details>
                
                {combinedUserData?.firestoreUser && (
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Ver datos Firestore completos
                    </summary>
                    <div className="bg-muted/50 p-4 rounded-lg mt-3 max-h-96 overflow-y-auto">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(combinedUserData.firestoreUser, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}