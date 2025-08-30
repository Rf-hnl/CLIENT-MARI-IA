'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/modules/auth'
import { useTenant } from '@/contexts/TenantContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Settings,
  Lock,
  Bell,
  Palette,
  Globe,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Edit,
  Save,
  X,
  Loader2,
  Upload,
  Key,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Info,
  PlusCircle,
  Users // Added Users icon
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadImageToUploadThing, validateImageFile } from '@/lib/uploadthing-helpers'
import { formatDate } from '@/utils/dateFormat'

interface ProfileUpdateResult {
  success: boolean
  message: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string | null;
  industry: string | null;
  salesPitch: string | null;
}

// Interface for Member data fetched from API
interface Member {
  type: 'member' | 'invitation';
  userId: string | null;
  invitationId?: string;
  email: string | null | undefined;
  name: string | null | undefined;
  role: string; // Role enum string
  status: 'confirmed' | 'pending';
  addedByUserId: string | null | undefined;
  invitationLink?: string;
  expiresAt?: Date;
}

export default function ProfilePage() {
  const { currentUser, loading, updateProfile } = useAuth()
  const { currentTenant, currentOrganization, refreshTenantData } = useTenant()
  const router = useRouter()
  const [updateResult, setUpdateResult] = useState<ProfileUpdateResult | null>(null)
  
  // Estados para edición de perfil
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editedDisplayName, setEditedDisplayName] = useState(currentUser?.displayName || '')
  const [editedPhone, setEditedPhone] = useState(currentUser?.phone || '')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Estados para preferencias
  const [theme, setTheme] = useState('auto')
  const [language, setLanguage] = useState('es')
  const [timezone, setTimezone] = useState('GMT-5')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(true)

  // Estados para edición de organización
  const [isEditingOrg, setIsEditingOrg] = useState(false)
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [editedOrgData, setEditedOrgData] = useState<Partial<Organization>>({})

  // Estados para lista de organizaciones y creación
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', description: '' });
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);

  // Estados para gestión de miembros
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({ email: '', role: 'MEMBER' });
  
  // Estados para modal de confirmación de eliminación
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{userId: string, name: string} | null>(null);

  useEffect(() => {
    if (loading) return
    if (!currentUser) {
      router.push('/')
      return
    }
    // Actualizar estados cuando cambie el usuario
    setEditedDisplayName(currentUser.displayName || '')
    setEditedPhone(currentUser.phone || '')
  }, [currentUser, loading, router])

  useEffect(() => {
    if (currentOrganization) {
      setEditedOrgData(currentOrganization)
    }
  }, [currentOrganization])

  // Fetch members when the component mounts and currentOrganization is available
  useEffect(() => {
    if (currentOrganization) {
      fetchMembers();
    }
  }, [currentOrganization]);

  const fetchMembers = async () => {
    if (!currentOrganization) return;
    setIsLoadingMembers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/organizations/${currentOrganization.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      toast.error('Error al cargar miembros', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Function to update member role
  const updateMemberRole = async (userId: string, newRole: string) => {
    if (!currentOrganization) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/organizations/${currentOrganization.id}/members`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update member role');
      }

      const data = await response.json();
      toast.success('Rol actualizado exitosamente', {
        description: data.message
      });
      
      // Refresh members list
      fetchMembers();
    } catch (error) {
      toast.error('Error al actualizar rol', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // Function to open delete confirmation modal
  const openDeleteConfirmation = (userId: string, memberName: string) => {
    setMemberToDelete({ userId, name: memberName });
    setConfirmDeleteModalOpen(true);
  };

  // Function to remove member
  const confirmRemoveMember = async () => {
    if (!currentOrganization || !memberToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/organizations/${currentOrganization.id}/members`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: memberToDelete.userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      const data = await response.json();
      toast.success('Miembro eliminado exitosamente', {
        description: data.message
      });
      
      // Refresh members list
      fetchMembers();
    } catch (error) {
      toast.error('Error al eliminar miembro', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setConfirmDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  // Function to cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    if (!currentOrganization) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/organizations/${currentOrganization.id}/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invitation');
      }

      const data = await response.json();
      toast.success('Invitación cancelada exitosamente', {
        description: data.message
      });
      
      // Refresh members list
      fetchMembers();
    } catch (error) {
      toast.error('Error al cancelar invitación', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedOrgData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingOrg(true)
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Error de autenticación', {
          description: 'No se encontró el token de sesión. Por favor, inicia sesión de nuevo.'
        })
        setIsSavingOrg(false)
        return
      }

      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedOrgData),
      })

      if (!response.ok) {
        throw new Error('Failed to update organization')
      }

      await refreshTenantData()
      toast.success('¡Organización actualizada!', {
        description: 'Los cambios han sido guardados exitosamente'
      })
      setIsEditingOrg(false)
    } catch (error) {
      toast.error('Error al actualizar organización', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsSavingOrg(false)
    }
  }

  const fetchOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/organizations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      toast.error('Error al cargar organizaciones', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOrg(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newOrgData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }

      toast.success('¡Organización creada!', {
        description: 'La nueva organización se ha creado exitosamente.'
      });
      setNewOrgData({ name: '', description: '' });
      setIsCreateDialogOpen(false);
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      toast.error('Error al crear organización', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    setSwitchingOrgId(orgId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/set-active-organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newOrganizationId: orgId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to switch organization');
      }

      // Replace the old token and reload the app
      localStorage.setItem('auth_token', result.newAuthToken);
      toast.success('Organización cambiada', {
        description: 'La página se recargará para aplicar los cambios.'
      });

      // Wait a bit for the toast to be visible, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      toast.error('Error al cambiar de organización', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setSwitchingOrgId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) return null

  const userInitials = currentUser.email?.substring(0, 2).toUpperCase() || 'US'
  
  // Función para subir imagen
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      toast.error('Archivo inválido', {
        description: validation.error || 'Formato de imagen no soportado'
      })
      return
    }

    setIsUploadingImage(true)

    try {
      const result = await uploadImageToUploadThing(file)
      setPreviewImage(result.secure_url)
      toast.success('Imagen cargada', {
        description: 'Haz clic en "Guardar Cambios" para aplicar'
      })
    } catch (error) {
      toast.error('Error al subir imagen', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Función para guardar cambios de perfil
  const handleSaveProfile = async () => {
    if (!currentUser) return
    
    setIsUpdating(true)
    
    try {
      const updateData: { displayName?: string; phone?: string; avatarUrl?: string } = {}
      
      if (editedDisplayName !== currentUser.displayName) {
        updateData.displayName = editedDisplayName.trim()
      }
      
      if (editedPhone !== currentUser.phone) {
        updateData.phone = editedPhone.trim()
      }
      
      if (previewImage && previewImage !== currentUser.avatarUrl) {
        updateData.avatarUrl = previewImage
      }
      
      if (Object.keys(updateData).length > 0) {
        const result = await updateProfile(updateData)
        
        if (result.error) {
          toast.error('Error al actualizar perfil', {
            description: result.error
          })
        } else {
          toast.success('¡Perfil actualizado!', {
            description: 'Los cambios han sido guardados exitosamente'
          })
          setIsEditing(false)
          setPreviewImage(null)
        }
      } else {
        toast.info('Sin cambios detectados')
        setIsEditing(false)
      }
    } catch (error) {
      toast.error('Error inesperado', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      // TODO: Implementar API para cambio de contraseña
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simular API call
      
      toast.success('¡Contraseña cambiada!', {
        description: 'Tu contraseña ha sido actualizada exitosamente'
      })
      
      setShowPasswordForm(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error('Error al cambiar contraseña')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Función para activar el selector de archivos
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Function to handle invite submission
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setIsInvitingMember(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/organizations/${currentOrganization.id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteFormData.email,
          role: inviteFormData.role,
          // TODO: Set a proper expiration date, e.g., 7 days from now
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      toast.success('¡Invitación enviada!', {
        description: `Se ha enviado una invitación a ${inviteFormData.email} con el rol de ${inviteFormData.role}.`
      });
      setInviteFormData({ email: '', role: 'MEMBER' });
      setInviteModalOpen(false);
      fetchMembers(); // Refresh the member list to show pending invitations if applicable
    } catch (error) {
      toast.error('Error al enviar invitación', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsInvitingMember(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-7xl p-6 space-y-8">
        {/* Header mejorado con gradiente y shadow */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Mi Perfil
              </h1>
              <p className="text-muted-foreground text-lg">
                Administra tu información personal y configuraciones de cuenta
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-sm text-muted-foreground">En línea</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)} 
                disabled={isUpdating || isUploadingImage}
                variant={isEditing ? "default" : "outline"}
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
                size="lg"
              >
                {isUpdating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isEditing ? (
                  <Save className="h-5 w-5" />
                ) : (
                  <Edit className="h-5 w-5" />
                )}
                {isUpdating ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Editar Perfil'}
              </Button>
              {isEditing && (
                <Button 
                  onClick={() => {
                    setIsEditing(false)
                    setEditedDisplayName(currentUser.displayName || '')
                    setEditedPhone(currentUser.phone || '')
                    setPreviewImage(null)
                  }}
                  variant="ghost"
                  className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas mejoradas con shadows */}
        <Tabs defaultValue="personal" className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-2">
            <TabsList className="grid w-full grid-cols-5 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
              <TabsTrigger 
                value="personal" 
                className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20 data-[state=active]:border-orange-200 transition-all duration-300 py-3 px-4"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Personal</span>
              </TabsTrigger>
              <TabsTrigger 
                value="organization" 
                className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20 data-[state=active]:border-orange-200 transition-all duration-300 py-3 px-4"
              >
                <Building2 className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Organización</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20 data-[state=active]:border-orange-200 transition-all duration-300 py-3 px-4"
              >
                <Lock className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20 data-[state=active]:border-orange-200 transition-all duration-300 py-3 px-4"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Preferencias</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20 data-[state=active]:border-orange-200 transition-all duration-300 py-3 px-4"
              >
                <Bell className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Notificaciones</span>
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/20 data-[state=active]:border-orange-200 transition-all duration-300 py-3 px-4"
              >
                <Users className="w-5 h-5" /> {/* Assuming Users icon is available */}
                <span className="hidden sm:inline font-medium">Miembros</span>
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Tab: Información Personal */}
        <TabsContent value="personal" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Columna Principal - Información Personal */}
            <div className="xl:col-span-3 space-y-8">
              
              {/* Información Básica */}
              <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>
                    Tu información básica de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Avatar y Upload mejorado */}
                  <div className="flex items-start gap-8">
                    <div className="relative group">
                      <div className="p-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-lg">
                        <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-700 shadow-xl">
                          <AvatarImage 
                            src={previewImage || currentUser.avatarUrl || undefined} 
                            alt={currentUser.displayName || 'Usuario'} 
                          />
                          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="default"
                          size="icon"
                          className="absolute -bottom-1 -right-1 rounded-full h-10 w-10 shadow-lg hover:shadow-xl transition-all duration-300 bg-orange-500 hover:bg-orange-600"
                          onClick={triggerFileInput}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                      {!isEditing && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full shadow-lg"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          {currentUser.displayName || 'Sin nombre configurado'}
                        </h3>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {currentUser.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={currentUser.emailVerified ? "default" : "secondary"}>
                            {currentUser.emailVerified ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {currentUser.emailVerified ? 'Verificado' : 'Sin verificar'}
                          </Badge>
                        </div>
                      </div>
                      {isEditing && (
                        <p className="text-xs text-muted-foreground mt-2">
                          JPG, PNG, WebP o GIF. Máximo 5MB.
                        </p>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <Separator />

                  {/* Formulario de Edición */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Nombre Completo</Label>
                        <Input
                          id="displayName"
                          value={editedDisplayName}
                          onChange={(e) => setEditedDisplayName(e.target.value)}
                          placeholder="Tu nombre completo"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          placeholder="+507 6000-0000"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={currentUser.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        El email no se puede cambiar por razones de seguridad
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={() => {
                          setIsEditing(false)
                          setEditedDisplayName(currentUser.displayName || '')
                          setEditedPhone(currentUser.phone || '')
                          setPreviewImage(null)
                        }} 
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna Lateral - Información del Sistema */}
            <div className="space-y-8">
              
              {/* Estado de Cuenta */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-green-400 to-green-500 rounded-lg shadow-md">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                      Estado de Cuenta
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge variant="default">Activa</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rol:</span>
                      <Badge variant="outline">{currentUser.role}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email:</span>
                      <Badge variant={currentUser.emailVerified ? "default" : "secondary"}>
                        {currentUser.emailVerified ? 'Verificado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actividad Reciente */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg shadow-md">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                      Actividad
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Cuenta creada:
                      </span>
                      <span className="text-xs">
                        {currentUser.createdAt ? formatDate(currentUser.createdAt.toString()) : 'Nunca'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        Último acceso:
                      </span>
                      <span className="text-xs">
                        {currentUser.lastSignIn ? formatDate(currentUser.lastSignIn.toString()) : 'Nunca'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Accesos:</span>
                      <Badge variant="outline">
                        {currentUser.signInCount || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Técnica */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg shadow-md">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                      Info Técnica
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">ID de Usuario:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded break-all">
                        {currentUser.id}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Organización */}
        <TabsContent value="organization" className="space-y-8">
          {/* Editor de Organización Activa */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-6 flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    Entorno de Trabajo
                  </span>
                </CardTitle>
                <CardDescription className="text-base pl-12">
                  Información sobre el tenant y la organización que estás usando actualmente.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditingOrg ? (
                  <>
                    <Button onClick={handleSaveOrganization} disabled={isSavingOrg} className="gap-2">
                      {isSavingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isSavingOrg ? 'Guardando' : 'Guardar'}
                    </Button>
                    <Button onClick={() => setIsEditingOrg(false)} variant="ghost">Cancelar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditingOrg(true)} variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Organización
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información de Tenant y Organización */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 border rounded-lg bg-gray-50/50 dark:bg-gray-800/20">
                {/* Columna de Tenant */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Información del Tenant</h3>
                  {currentTenant ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="font-medium">{currentTenant.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Plan:</span>
                        <Badge variant="outline">{currentTenant.plan || 'Free'}</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">ID del Tenant:</span>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">{currentTenant.id}</span>
                      </div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No disponible</p>}
                </div>

                {/* Columna de Organización Activa */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Organización Activa</h3>
                  {currentOrganization ? (
                     <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="font-medium">{currentOrganization.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge variant="default">Activa</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">ID de Organización:</span>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">{currentOrganization.id}</span>
                      </div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No disponible</p>}
                </div>
              </div>

              <Separator />

              {/* Formulario de Edición de Organización */}
              {currentOrganization ? (
                <form onSubmit={handleSaveOrganization}>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {isEditingOrg ? 'Modifica los campos a continuación para actualizar la organización.' : 'Haz clic en "Editar Organización" para modificar los detalles.'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Nombre de la Organización</Label>
                        <Input id="orgName" name="name" value={editedOrgData.name || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgIndustry">Industria</Label>
                        <Input id="orgIndustry" name="industry" value={editedOrgData.industry || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgEmail">Email</Label>
                        <Input id="orgEmail" name="email" type="email" value={editedOrgData.email || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgPhone">Teléfono</Label>
                        <Input id="orgPhone" name="phone" value={editedOrgData.phone || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgWebsite">Sitio Web</Label>
                        <Input id="orgWebsite" name="website" value={editedOrgData.website || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="orgTimezone">Zona Horaria</Label>
                        <Select 
                          value={editedOrgData.timezone || ''} 
                          onValueChange={(value) => setEditedOrgData(prev => ({ ...prev, timezone: value }))}
                          disabled={!isEditingOrg}
                        >
                          <SelectTrigger id="orgTimezone">
                            <SelectValue placeholder="Selecciona una zona horaria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GMT-12">GMT-12:00</SelectItem>
                            <SelectItem value="GMT-11">GMT-11:00</SelectItem>
                            <SelectItem value="GMT-10">GMT-10:00 (Hawái)</SelectItem>
                            <SelectItem value="GMT-9">GMT-09:00 (Alaska)</SelectItem>
                            <SelectItem value="GMT-8">GMT-08:00 (Hora del Pacífico)</SelectItem>
                            <SelectItem value="GMT-7">GMT-07:00 (Hora de la Montaña)</SelectItem>
                            <SelectItem value="GMT-6">GMT-06:00 (Hora del Centro)</SelectItem>
                            <SelectItem value="GMT-5">GMT-05:00 (Hora del Este, Panamá)</SelectItem>
                            <SelectItem value="GMT-4">GMT-04:00 (Hora del Atlántico)</SelectItem>
                            <SelectItem value="GMT-3">GMT-03:00 (Argentina, Brasil)</SelectItem>
                            <SelectItem value="GMT-2">GMT-02:00</SelectItem>
                            <SelectItem value="GMT-1">GMT-01:00</SelectItem>
                            <SelectItem value="GMT+0">GMT+00:00 (UTC, Londres)</SelectItem>
                            <SelectItem value="GMT+1">GMT+01:00 (Madrid, París)</SelectItem>
                            <SelectItem value="GMT+2">GMT+02:00 (Atenas, El Cairo)</SelectItem>
                            <SelectItem value="GMT+3">GMT+03:00 (Moscú)</SelectItem>
                            <SelectItem value="GMT+4">GMT+04:00 (Dubái)</SelectItem>
                            <SelectItem value="GMT+5">GMT+05:00</SelectItem>
                            <SelectItem value="GMT+6">GMT+06:00</SelectItem>
                            <SelectItem value="GMT+7">GMT+07:00 (Bangkok)</SelectItem>
                            <SelectItem value="GMT+8">GMT+08:00 (Pekín, Singapur)</SelectItem>
                            <SelectItem value="GMT+9">GMT+09:00 (Tokio)</SelectItem>
                            <SelectItem value="GMT+10">GMT+10:00 (Sídney)</SelectItem>
                            <SelectItem value="GMT+11">GMT+11:00</SelectItem>
                            <SelectItem value="GMT+12">GMT+12:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="orgDescription">Descripción</Label>
                        <Textarea id="orgDescription" name="description" value={editedOrgData.description || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} rows={3} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="orgSalesPitch">Argumento de Venta (Sales Pitch)</Label>
                        <Textarea id="orgSalesPitch" name="salesPitch" value={editedOrgData.salesPitch || ''} onChange={handleOrgInputChange} disabled={!isEditingOrg} rows={3} />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay información de organización disponible</p>
                  <p className="text-xs text-gray-400 mt-2">Los datos se cargarán automáticamente cuando estén disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Todas las Organizaciones */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Todas las Organizaciones del Tenant</CardTitle>
                <CardDescription>Aquí puedes ver y crear nuevas organizaciones.</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Crear Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Organización</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrganization}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-org-name" className="text-right">Nombre</Label>
                        <Input id="new-org-name" value={newOrgData.name} onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-org-desc" className="text-right">Descripción</Label>
                        <Input id="new-org-desc" value={newOrgData.description} onChange={(e) => setNewOrgData({ ...newOrgData, description: e.target.value })} className="col-span-3" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isCreatingOrg}>
                        {isCreatingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isCreatingOrg ? 'Creando...' : 'Crear Organización'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingOrgs ? (
                <p className="text-center text-muted-foreground">Cargando lista de organizaciones...</p>
              ) : (
                <ul className="space-y-3">
                  {organizations.map(org => (
                    <li key={org.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{org.id}</p>
                        </div>
                      </div>
                      {currentOrganization?.id === org.id ? (
                        <Badge>Activa</Badge>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleSwitchOrganization(org.id)}
                          disabled={switchingOrgId === org.id}
                        >
                          {switchingOrgId === org.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {switchingOrgId === org.id ? 'Cambiando...' : 'Cambiar a esta'}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Seguridad */}
        <TabsContent value="security" className="space-y-8">
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                  Configuración de Seguridad
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Administra la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Cambio de contraseña */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Contraseña</h3>
                      <p className="text-sm text-gray-500">Cambiar tu contraseña de acceso</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {showPasswordForm ? 'Cancelar' : 'Cambiar'}
                    </Button>
                  </div>
                  
                  {showPasswordForm && (
                    <div className="mt-4 space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Contraseña actual</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              placeholder="Ingresa tu contraseña actual"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nueva contraseña</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              placeholder="Ingresa tu nueva contraseña"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              placeholder="Confirma tu nueva contraseña"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleChangePassword}
                          disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="w-full"
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cambiando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Cambiar Contraseña
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verificación de email */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Verificación de email</h3>
                      <p className="text-sm text-gray-500">
                        {currentUser.emailVerified ? 'Tu email está verificado' : 'Verifica tu dirección de email para mayor seguridad'}
                      </p>
                    </div>
                    {currentUser.emailVerified ? (
                      <Badge variant="default">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verificado
                      </Badge>
                    ) : (
                      <Button variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Verificar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preferencias */}
        <TabsContent value="preferences" className="space-y-8">
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-md">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                  Preferencias del Usuario
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Personaliza la experiencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                {/* Tema */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Palette className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">Tema</h3>
                        <p className="text-sm text-gray-500">Personaliza la apariencia de la aplicación</p>
                      </div>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            Claro
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            Oscuro
                          </div>
                        </SelectItem>
                        <SelectItem value="auto">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            Auto
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Idioma */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-green-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">Idioma</h3>
                        <p className="text-sm text-gray-500">Selecciona tu idioma preferido</p>
                      </div>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Zona horaria */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">Zona horaria</h3>
                        <p className="text-sm text-gray-500">Configura tu zona horaria local</p>
                      </div>
                    </div>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GMT-5">GMT-5 (Panamá)</SelectItem>
                        <SelectItem value="GMT-6">GMT-6 (México)</SelectItem>
                        <SelectItem value="GMT-3">GMT-3 (Argentina)</SelectItem>
                        <SelectItem value="GMT+1">GMT+1 (España)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificaciones */}
        <TabsContent value="notifications" className="space-y-8">
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-md">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
                  Configuración de Notificaciones
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Controla cómo y cuándo recibes notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Notificaciones por email */}
                <div className="flex items-center justify-between p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900">
                  <div>
                    <h3 className="font-medium">Notificaciones por email</h3>
                    <p className="text-sm text-gray-500">Recibe actualizaciones por correo electrónico</p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                {/* Notificaciones push */}
                <div className="flex items-center justify-between p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-green-900">
                  <div>
                    <h3 className="font-medium">Notificaciones push</h3>
                    <p className="text-sm text-gray-500">Recibe notificaciones en el navegador</p>
                  </div>
                  <Switch 
                    checked={pushNotifications} 
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                {/* Resumen semanal */}
                <div className="flex items-center justify-between p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900">
                  <div>
                    <h3 className="font-medium">Resumen semanal</h3>
                    <p className="text-sm text-gray-500">Recibe un resumen de actividad cada semana</p>
                  </div>
                  <Switch 
                    checked={weeklyReport} 
                    onCheckedChange={setWeeklyReport}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Miembros */}
        <TabsContent value="members" className="space-y-8">
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Gestión de Miembros
                  </span>
                </CardTitle>
                <CardDescription className="text-base pl-12">
                  Administra los miembros de tu organización y envía invitaciones.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                      <PlusCircle className="h-4 w-4" />
                      Invitar Miembro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                      <DialogDescription>Introduce el email y el rol para invitar a un nuevo miembro.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteMember}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="invite-email" className="text-right">Email</Label>
                          <Input 
                            id="invite-email" 
                            type="email" 
                            value={inviteFormData.email} 
                            onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})} 
                            className="col-span-3" 
                            required 
                            placeholder="ej: usuario@dominio.com"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="invite-role" className="text-right">Rol</Label>
                          <Select 
                            value={inviteFormData.role} 
                            onValueChange={(value) => setInviteFormData({...inviteFormData, role: value})} 
                            required
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER">Owner</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isInvitingMember}>
                          {isInvitingMember ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Enviar Invitación
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <p className="text-center text-muted-foreground">Cargando miembros...</p>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aún no hay miembros en esta organización.</p>
                  <p className="text-xs text-gray-400 mt-2">Invita a alguien para empezar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {members.map((member) => (
                        <tr key={member.userId || member.invitationId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.name || 'N/A'}
                            {member.status === 'pending' && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Pendiente
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant={member.status === 'pending' ? 'secondary' : 'outline'}>
                              {member.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                            {member.status === 'confirmed' && member.userId ? (
                              <>
                                {/* Role change dropdown - only for confirmed members */}
                                <Select 
                                  value={member.role} 
                                  onValueChange={(newRole) => updateMemberRole(member.userId!, newRole)}
                                  disabled={member.userId === currentUser?.id || member.role === 'OWNER'}
                                >
                                  <SelectTrigger className="w-32 text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-400">
                                    <SelectValue placeholder={member.role} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="OWNER">OWNER</SelectItem>
                                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                                    <SelectItem value="MEMBER">MEMBER</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                {/* Remove member button */}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => openDeleteConfirmation(member.userId!, member.name || member.email || 'Usuario')}
                                  disabled={member.userId === currentUser?.id || member.role === 'OWNER'}
                                >
                                  Eliminar
                                </Button>
                              </>
                            ) : (
                              <>
                                {/* For pending invitations - show invitation link and cancel option */}
                                {member.invitationLink && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(member.invitationLink!);
                                      toast.success('Enlace copiado al portapapeles');
                                    }}
                                  >
                                    Copiar Enlace
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => cancelInvitation(member.invitationId!)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Confirmation Modal for Member Deletion */}
      <Dialog open={confirmDeleteModalOpen} onOpenChange={setConfirmDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a <strong>{memberToDelete?.name}</strong> de la organización? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemoveMember}
            >
              Eliminar Miembro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
