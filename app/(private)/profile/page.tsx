'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.push('/');
      return;
    }

    if (!currentUser.emailVerified) {
      router.push('/verify');
      return;
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver al Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Mi Perfil
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración de Perfil
          </h2>
          <p className="text-gray-600">
            Administra tu información personal y configuraciones de cuenta.
          </p>
        </div>

        <ProfileForm 
          onProfileUpdated={(updatedProfile) => {
            // Aquí podrías implementar alguna lógica adicional después de actualizar el perfil
            console.log('Perfil actualizado:', updatedProfile);
          }}
        />

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Información de Seguridad
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Tu foto de perfil se almacena de forma segura en Cloudinary</p>
            <p>• Los cambios en tu perfil se sincronizan automáticamente con Firebase</p>
            <p>• Tu correo electrónico no puede ser modificado por seguridad</p>
            <p>• Todos los cambios quedan registrados en tu historial de cuenta</p>
          </div>
        </div>

        {/* Account Management Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Acciones de Cuenta
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full sm:w-auto">
                Cambiar Contraseña
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                Ver Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}