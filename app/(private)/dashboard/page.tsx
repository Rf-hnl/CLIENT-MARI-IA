'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (!currentUser.emailVerified) {
      router.push('/verify');
      return;
    }
  }, [currentUser, router]);

  async function handleLogout() {
    try {
      await logout();
      router.push('/');
    } catch (error: unknown) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  if (!currentUser || !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard - Client Mar-IA
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {currentUser.email}
              </span>
              <a
                href="/profile"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Mi Perfil
              </a>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Bienvenido al Dashboard!
              </h2>
              <p className="text-gray-600 mb-6">
                Has iniciado sesión exitosamente con Firebase Authentication.
              </p>
              
              <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información del Usuario
                </h3>
                <div className="text-left space-y-2">
                  <p><strong>Email:</strong> {currentUser.email}</p>
                  <p><strong>UID:</strong> {currentUser.uid}</p>
                  <p><strong>Email Verificado:</strong> {currentUser.emailVerified ? 'Sí' : 'No'}</p>
                  <p><strong>Creado:</strong> {currentUser.metadata.creationTime}</p>
                  <p><strong>Último acceso:</strong> {currentUser.metadata.lastSignInTime}</p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  Este es una página protegida. Solo usuarios autenticados y verificados pueden acceder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}