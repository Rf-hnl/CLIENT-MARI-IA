'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Building2, Mail, Lock, User, Check, Sparkles } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { setUserFromToken } = useAuth();

  const [formData, setFormData] = useState({
    userName: '',
    tenantName: '',
    tenantIdentifier: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUserInfo, setExistingUserInfo] = useState<{
    tenantName: string;
    tenantIdentifier: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    tenantIdentifier: string;
    userName: string;
    userEmail: string;
  } | null>(null);

  const isLogin = mode === 'login';
  const title = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta';
  const submitText = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta';
  const loadingText = isLogin ? 'Iniciando sesión...' : 'Creando cuenta...';

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (existingUserInfo) setExistingUserInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isLogin) {
        const { tenantIdentifier, email, password } = formData;
        if (!tenantIdentifier || !email || !password) {
          setError('Todos los campos son requeridos.');
          setLoading(false);
          return;
        }
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantIdentifier, email, password }),
        });
      } else {
        const { userName, tenantName, email, password, confirmPassword } = formData;
        if (!userName || !tenantName || !email || !password) {
          setError('Todos los campos son requeridos.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }
        response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, tenantName, userEmail: email, password }),
        });
      }

      if (response.ok) {
        const responseData = await response.json();
        
        // Set user immediately in AuthContext if token provided
        if (responseData.token) {
          console.log('🚀 Setting user from token immediately');
          setUserFromToken(responseData.token);
        }
        
        if (isLogin) {
          router.push('/dashboard');
        } else {
          // Registration successful - show tenant identifier
          setRegistrationSuccess({
            tenantIdentifier: responseData.tenantIdentifier,
            userName: responseData.userName,
            userEmail: responseData.userEmail
          });
        }
      } else {
        const errorData = await response.json();
        
        // Handle specific case of existing user
        if (errorData.errorType === 'EMAIL_EXISTS' && errorData.existingTenant) {
          setExistingUserInfo({
            tenantName: errorData.existingTenant.name,
            tenantIdentifier: errorData.existingTenant.identifier
          });
          setError('Este email ya está registrado');
        } else {
          setError(errorData.error || 'Ocurrió un error inesperado.');
        }
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Show success screen after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Success Background Pattern */}
        <div className="absolute inset-0 opacity-50">
          <div className="w-full h-full bg-green-100 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#059669_1px,_transparent_1px)] bg-[length:60px_60px]"></div>
        </div>
        
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 shadow-2xl border-0 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Check className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ¡Cuenta Creada!
            </CardTitle>
            <p className="text-gray-600">
              Tu empresa se ha registrado exitosamente
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de tu cuenta:
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                  <User className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="font-medium text-green-700 text-sm block">Usuario:</span>
                    <span className="text-green-800 font-semibold">{registrationSuccess.userName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                  <Mail className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="font-medium text-green-700 text-sm block">Email:</span>
                    <span className="text-green-800 font-semibold">{registrationSuccess.userEmail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="font-medium text-green-700 text-sm block">Identificador:</span>
                    <span className="font-mono bg-green-100 px-3 py-1 rounded-lg text-green-800 font-semibold text-lg">
                      {registrationSuccess.tenantIdentifier}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800">
                    <strong className="text-amber-900">¡Importante!</strong><br />
                    Guarda el identificador <code className="bg-amber-100 px-2 py-1 rounded font-mono text-amber-900">{registrationSuccess.tenantIdentifier}</code><br />
                    lo necesitarás para iniciar sesión.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/dashboard')} 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/auth/login')} 
                variant="outline" 
                className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-medium py-3 transition-all duration-200"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Ir al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-slate-100 bg-[radial-gradient(circle_at_50%_50%,_#e2e8f0_1px,_transparent_1px)] bg-[length:60px_60px]"></div>
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 shadow-2xl border-0 relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-2">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {title}
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            {isLogin ? (
              <>
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Crear cuenta
                </Link>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Iniciar sesión
                </Link>
              </>
            )}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {existingUserInfo && (
              <Alert className="border-blue-200 bg-blue-50/80 backdrop-blur-sm">
                <Building2 className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="text-blue-800 font-medium">
                      Ya tienes una cuenta en <strong>{existingUserInfo.tenantName}</strong>
                    </p>
                    <div className="bg-blue-100 rounded-lg p-3">
                      <p className="text-blue-700 text-sm mb-2">
                        <strong>Identificador de tu empresa:</strong>
                      </p>
                      <code className="bg-blue-200 px-2 py-1 rounded font-mono text-blue-900 text-sm">
                        {existingUserInfo.tenantIdentifier}
                      </code>
                    </div>
                    <Button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tenantIdentifier: existingUserInfo.tenantIdentifier,
                          email: prev.email,
                          password: ''
                        }));
                        setExistingUserInfo(null);
                        setError('');
                        router.push('/auth/login');
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Ir al Login con mis datos
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isLogin && (
              <div className="space-y-2">
                <Label htmlFor="tenantIdentifier" className="text-gray-700 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Identificador del Tenant
                </Label>
                <div className="relative">
                  <Input
                    id="tenantIdentifier"
                    type="text"
                    placeholder="ej: acme-corp"
                    value={formData.tenantIdentifier}
                    onChange={(e) => handleChange('tenantIdentifier', e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-gray-700 font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Tu Nombre
                  </Label>
                  <div className="relative">
                    <Input
                      id="userName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.userName}
                      onChange={(e) => handleChange('userName', e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantName" className="text-gray-700 font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    Nombre de tu Empresa
                  </Label>
                  <div className="relative">
                    <Input
                      id="tenantName"
                      type="text"
                      placeholder="Acme Inc."
                      value={formData.tenantName}
                      onChange={(e) => handleChange('tenantName', e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Correo electrónico
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-500" />
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-500 underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 transition-all duration-200 shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingText}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {submitText}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
