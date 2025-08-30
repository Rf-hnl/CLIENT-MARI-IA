'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
    description?: string;
  };
  invitedBy: {
    name?: string;
    email: string;
  };
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const token = params.token as string;

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    }
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener la invitación');
      }

      setInvitation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const authToken = await getToken();
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aceptar la invitación');
      }

      // Redirect to organization dashboard
      router.push(`/organizations/${data.organization.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Cargando Invitación</h2>
            <p className="text-gray-600 text-sm">Verificando los detalles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full mx-4 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-3">Invitación Inválida</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-xs">{error}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-500 text-xl">❓</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Invitación no encontrada</h2>
            <p className="text-gray-600 text-sm">La invitación que buscas no existe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4">
      <div className="max-w-sm w-full mx-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-orange-500 text-2xl">📧</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">¡Estás Invitado!</h1>
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-gray-900">
                {invitation.invitedBy.name || invitation.invitedBy.email}
              </span> te ha invitado a unirte
            </p>
          </div>
        </div>

        {/* Organization Info */}
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">
                {invitation.organization.name.charAt(0)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {invitation.organization.name}
            </h2>
            {invitation.organization.description && (
              <p className="text-gray-600 text-xs mb-3">
                {invitation.organization.description}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-600">Rol:</span>
              <span className="font-medium text-gray-900 text-sm">{invitation.role}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-600">Email:</span>
              <span className="font-medium text-gray-900 text-xs">{invitation.email}</span>
            </div>
            {invitation.expiresAt && (
              <div className="flex items-center justify-between py-1.5 px-2 bg-orange-50 rounded">
                <span className="text-xs text-orange-600">Expira:</span>
                <span className="font-medium text-orange-700 text-xs">
                  {new Date(invitation.expiresAt).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

        {!user ? (
          <div className="space-y-3">
            <div className="text-center bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700 font-medium text-sm mb-1">Autenticación Requerida</p>
              <p className="text-gray-600 text-xs">Necesitas iniciar sesión</p>
            </div>
            
            <button
              onClick={() => router.push(`/auth/login?returnUrl=/invite/${token}`)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
            >
              Iniciar Sesión
            </button>
            
            <div className="text-center">
              <span className="text-gray-600 text-xs">¿No tienes cuenta? </span>
              <button
                onClick={() => router.push(`/auth/register?returnUrl=/invite/${token}`)}
                className="text-orange-500 hover:text-orange-600 text-xs font-medium"
              >
                Regístrate
              </button>
            </div>
          </div>
        ) : user.email?.toLowerCase() !== invitation.email.toLowerCase() ? (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-red-500 text-sm">⚠️</span>
                <h3 className="text-red-800 font-medium text-sm">Error de Seguridad</h3>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-red-700">
                  Esta invitación es para <strong>{invitation.email}</strong> pero tienes sesión iniciada como <strong>{user.email}</strong>.
                </p>
                <p className="text-red-600">
                  Solo el usuario correcto puede aceptar esta invitación.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1 text-xs">Opciones:</h4>
              <ul className="text-gray-700 text-xs space-y-0.5">
                <li>• Cierra sesión e inicia con {invitation.email}</li>
                <li>• Si no tienes acceso, contacta al administrador</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  router.push(`/auth/login?returnUrl=/invite/${token}`);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg font-medium transition-colors text-xs"
              >
                Cambiar Cuenta
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg font-medium transition-colors text-xs"
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={acceptInvitation}
              disabled={accepting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed text-sm"
            >
              {accepting ? (
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Aceptando...</span>
                </div>
              ) : (
                'Aceptar Invitación'
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-1">
              <span className="text-red-500 text-sm">⚠️</span>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}