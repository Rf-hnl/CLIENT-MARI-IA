'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Verify() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, resendVerification, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (currentUser.emailVerified) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  async function handleResendVerification() {
    try {
      setLoading(true);
      setMessage('');
      await resendVerification();
      setMessage('Correo de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (error: unknown) {
      setMessage('Error al enviar correo: ' + (error as Error).message);
    }
    setLoading(false);
  }

  async function handleLogout() {
    try {
      await logout();
      router.push('/');
    } catch (error: unknown) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verificar Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hemos enviado un correo de verificación a
          </p>
          <p className="mt-1 text-center text-sm font-medium text-gray-900">
            {currentUser.email}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {message && (
            <div className={`rounded-md p-4 ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-800' 
                : 'bg-green-50 text-green-800'
            }`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {message}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Por favor, verifica tu correo electrónico
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    1. Revisa tu bandeja de entrada (y spam)<br/>
                    2. Haz clic en el enlace de verificación<br/>
                    3. Regresa aquí y actualiza la página
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              disabled={loading}
              onClick={handleResendVerification}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Actualizar página
            </button>

            <button
              onClick={handleLogout}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}