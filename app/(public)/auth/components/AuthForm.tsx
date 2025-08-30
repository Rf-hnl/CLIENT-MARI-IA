'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Building2, Mail, Lock, User, Check, Sparkles } from 'lucide-react';

// Presentational components
import { AuthSplitLayout } from './AuthSplitLayout';
import { AuthHero } from './AuthHero';
import { AuthCard } from './AuthCard';
import { Field } from './Field';
import { PasswordInput } from './PasswordInput';
import { PasswordChecklist } from './PasswordChecklist';
import { SocialButtons } from './SocialButtons';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { setUserFromToken } = useAuth();

  // ===== EXACT SAME STATE - NO CHANGES =====
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

  // ===== EXACT SAME HANDLERS - NO CHANGES =====
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

  // ===== SUCCESS SCREEN - SAME LOGIC, NEW LAYOUT =====
  if (registrationSuccess) {
    return (
      <AuthSplitLayout
        left={
          <AuthHero
            claim={{
              primary: "¡Bienvenido a MAR-IA!",
              secondary: "Tu cuenta empresarial ha sido creada exitosamente 🎉"
            }}
          />
        }
        right={
          <AuthCard
            title="¡Cuenta Creada!"
            subtitle={
              <p className="text-muted-foreground">
                Tu empresa se ha registrado exitosamente
              </p>
            }
          >
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
                className="h-11 w-full rounded-md bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl border-0"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/auth/login')} 
                variant="outline" 
                className="h-11 w-full rounded-md border-orange-200 hover:bg-orange-50 text-orange-700 hover:text-orange-800 font-medium transition-all duration-200 border-2"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Ir al Login
              </Button>
            </div>
          </AuthCard>
        }
      />
    );
  }

  // ===== GENERATE PASSWORD RULES (for register mode) =====
  const passwordRules = !isLogin ? [
    {
      id: 'length',
      text: 'Al menos 6 caracteres',
      isValid: formData.password.length >= 6
    },
    {
      id: 'match',
      text: 'Las contraseñas coinciden',
      isValid: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
    }
  ] : [];

  // ===== MAIN AUTH FORM WITH SPLIT LAYOUT =====
  return (
    <AuthSplitLayout
      left={
        <AuthHero
          claim={{
            primary: "Potencia tu gestión de leads con IA",
            secondary: "Califica, analiza y convierte prospectos automáticamente 🚀"
          }}
          logos={[
            // { src: "/placeholder-logo.png", alt: "Booking", width: 80, height: 32 },
            // { src: "/placeholder-logo.png", alt: "Spotify", width: 80, height: 32 },
            // { src: "/placeholder-logo.png", alt: "Google", width: 80, height: 32 }
          ]}
        />
      }
      right={
        <AuthCard
          title={title}
          subtitle={
            <p>
              {isLogin ? (
                <>
                  ¿No tienes cuenta?{' '}
                  <Link href="/auth/register" className="font-medium text-orange-600 hover:underline">
                    Crear cuenta
                  </Link>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/auth/login" className="font-medium text-orange-600 hover:underline">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </p>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ===== ERROR ALERTS - EXACT SAME LOGIC ===== */}
            {error && (
              <Alert className="border-red-200 bg-red-50/80 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {existingUserInfo && (
              <Alert className="border-blue-200 bg-blue-50/80 rounded-xl">
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
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-md border-0"
                      size="sm"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Ir al Login con mis datos
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* ===== FORM FIELDS - EXACT SAME NAMES, IDS, HANDLERS ===== */}
            {isLogin && (
              <Field
                label="Identificador del Tenant"
                name="tenantIdentifier"
                icon={<Building2 className="w-4 h-4 text-orange-600" />}
              >
                <Input
                  id="tenantIdentifier"
                  name="tenantIdentifier"
                  type="text"
                  placeholder="ej: acme-corp"
                  value={formData.tenantIdentifier}
                  onChange={(e) => handleChange('tenantIdentifier', e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="organization"
                  className="h-11 pl-10 rounded-md bg-white dark:bg-neutral-900 border-2 border-orange-200 dark:border-orange-800 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-orange-500 transition-all duration-200"
                />
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </Field>
            )}

            {!isLogin && (
              <>
                <Field
                  label="Tu Nombre"
                  name="userName"
                  icon={<User className="w-4 h-4 text-orange-600" />}
                >
                  <Input
                    id="userName"
                    name="userName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.userName}
                    onChange={(e) => handleChange('userName', e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="name"
                    className="h-11 pl-10 rounded-md bg-white dark:bg-neutral-900 border-2 border-orange-200 dark:border-orange-800 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-orange-500 transition-all duration-200"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </Field>

                <Field
                  label="Nombre de tu Empresa"
                  name="tenantName"
                  icon={<Building2 className="w-4 h-4 text-orange-600" />}
                >
                  <Input
                    id="tenantName"
                    name="tenantName"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.tenantName}
                    onChange={(e) => handleChange('tenantName', e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="organization"
                    className="h-11 pl-10 rounded-md bg-white dark:bg-neutral-900 border-2 border-orange-200 dark:border-orange-800 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-orange-500 transition-all duration-200"
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </Field>
              </>
            )}

            <Field
              label="Correo electrónico"
              name="email"
              icon={<Mail className="w-4 h-4 text-orange-600" />}
            >
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                className="h-11 pl-10 rounded-md bg-white dark:bg-neutral-900 border-2 border-orange-200 dark:border-orange-800 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-orange-500 transition-all duration-200"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </Field>

            <Field
              label="Contraseña"
              name="password"
              icon={<Lock className="w-4 h-4 text-orange-600" />}
            >
              <PasswordInput
                id="password"
                name="password"
                placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={loading}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                leftIcon={<Lock className="h-4 w-4" />}
                aria-invalid={error ? 'true' : undefined}
              />
            </Field>

            {!isLogin && (
              <Field
                label="Confirmar contraseña"
                name="confirmPassword"
                icon={<Lock className="w-4 h-4 text-orange-600" />}
              >
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  aria-invalid={error ? 'true' : undefined}
                />
              </Field>
            )}

            {/* ===== PASSWORD CHECKLIST FOR REGISTER ===== */}
            {!isLogin && formData.password && (
              <PasswordChecklist rules={passwordRules} />
            )}

            {/* ===== FORGOT PASSWORD LINK ===== */}
            {isLogin && (
              <div className="flex justify-end">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-orange-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {/* ===== SUBMIT BUTTON - EXACT SAME LOGIC ===== */}
            <Button 
              type="submit" 
              className="h-11 w-full rounded-md bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl border-0" 
              disabled={loading}
              aria-describedby={error ? 'auth-error' : undefined}
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

          {/* ===== SOCIAL BUTTONS REMOVED - NOT IMPLEMENTED ===== */}
        </AuthCard>
      }
    />
  );
}