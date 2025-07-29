'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  EyeOff,
  Trash2 
} from 'lucide-react';
import { useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { ICreateElevenLabsConfigData, IUpdateElevenLabsConfigData } from '@/types/elevenlabs';

type ConfigFormData = {
  apiKey: string;
  apiUrl: string;
  phoneId: string;
  defaultVoiceId?: string;
  timezone: string;
  allowedCallHoursStart: string;
  allowedCallHoursEnd: string;
  maxConcurrentCalls: number;
  costLimitPerMonth: number;
};

export function ElevenLabsConfigSection() {
  const { 
    config, 
    isConfigured, 
    voices,
    testing,
    loading,
    createConfig, 
    updateConfig, 
    deleteConfig,
    testConnection,
    fetchVoices 
  } = useAgentsContext();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(!isConfigured);

  const form = useForm<ConfigFormData>({
    defaultValues: {
      apiKey: config?.apiKey || '',
      apiUrl: config?.apiUrl || 'https://api.elevenlabs.io',
      phoneId: config?.phoneId || '',
      defaultVoiceId: config?.settings?.defaultVoiceId || '',
      timezone: config?.settings?.timezone || 'America/Bogota',
      allowedCallHoursStart: config?.settings?.allowedCallHours?.start || '09:00',
      allowedCallHoursEnd: config?.settings?.allowedCallHours?.end || '18:00',
      maxConcurrentCalls: config?.settings?.maxConcurrentCalls || 5,
      costLimitPerMonth: config?.settings?.costLimitPerMonth || 5
    }
  });

  const onSubmit = async (data: ConfigFormData) => {
    try {
      const configData: ICreateElevenLabsConfigData | IUpdateElevenLabsConfigData = {
        apiKey: data.apiKey,
        apiUrl: data.apiUrl,
        phoneId: data.phoneId,
        settings: {
          defaultVoiceId: data.defaultVoiceId || '',
          timezone: data.timezone,
          allowedCallHours: {
            start: data.allowedCallHoursStart,
            end: data.allowedCallHoursEnd
          },
          allowedDays: [1, 2, 3, 4, 5], // Lun-Vie por defecto
          maxConcurrentCalls: data.maxConcurrentCalls,
          costLimitPerMonth: data.costLimitPerMonth || 5
        }
      };

      if (isConfigured) {
        await updateConfig(configData);
      } else {
        await createConfig(configData as ICreateElevenLabsConfigData);
      }

      setIsEditing(false);
      setTestResult(null);
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleTestConnection = async () => {
    console.log('🔍 [FRONTEND] Iniciando test de conexión...');
    
    try {
      // Limpiar resultado anterior
      setTestResult(null);
      
      const testConfig = {
        apiKey: form.getValues('apiKey'),
        apiUrl: form.getValues('apiUrl'),
        phoneId: form.getValues('phoneId')
      };

      console.log('📤 [FRONTEND] Enviando configuración:', {
        apiKey: testConfig.apiKey ? `${testConfig.apiKey.substring(0, 10)}...` : 'VACÍO',
        apiUrl: testConfig.apiUrl,
        phoneId: testConfig.phoneId ? `${testConfig.phoneId.substring(0, 10)}...` : 'VACÍO'
      });

      const result = await testConnection(testConfig);
      console.log('📥 [FRONTEND] Resultado recibido:', result);
      
      setTestResult(result);
      
      if (result.success) {
        console.log('✅ [FRONTEND] Test exitoso!');
        if (result.voices && result.voices.length > 0) {
          console.log('🎵 [FRONTEND] Voces recibidas en el test:', result.voices.length);
          // Las voces ya están en el resultado, no necesitamos llamar fetchVoices
        } else {
          console.log('🔄 [FRONTEND] Cargando voces por separado...');
          await fetchVoices();
        }
      } else {
        console.log('❌ [FRONTEND] Test falló:', result.error);
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error en handleTestConnection:', error);
      setTestResult({
        success: false,
        message: 'Error al probar la conexión',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  const handleDeleteConfig = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar la configuración de ElevenLabs?')) {
      try {
        await deleteConfig();
        setIsEditing(true);
        setTestResult(null);
        form.reset();
      } catch (error) {
        console.error('Error deleting config:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de ElevenLabs
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configura tu conexión con ElevenLabs para habilitar los agentes de voz
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured && !isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteConfig}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!isEditing && isConfigured ? (
            // Vista de solo lectura
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">API URL</Label>
                  <p className="text-sm text-muted-foreground">{config?.apiUrl}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone ID</Label>
                  <p className="text-sm text-muted-foreground">{config?.phoneId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <p className="text-sm text-muted-foreground">{config?.settings.timezone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Horario de Llamadas</Label>
                  <p className="text-sm text-muted-foreground">
                    {config?.settings.allowedCallHours.start} - {config?.settings.allowedCallHours.end}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Llamadas Concurrentes Máx.</Label>
                  <p className="text-sm text-muted-foreground">{config?.settings.maxConcurrentCalls}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Límite de Costo Mensual</Label>
                  <p className="text-sm text-muted-foreground">${config?.settings.costLimitPerMonth}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-2"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Probar Conexión
                </Button>
              </div>
            </div>
          ) : (
            // Formulario de edición
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Configuración Principal de ElevenLabs */}
                <div className="space-y-4">
                  <div className="pb-2 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Configuración Principal</h3>
                    <p className="text-sm text-muted-foreground">Credenciales básicas de ElevenLabs</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* API Key */}
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="sk-..."
                                {...field}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* API URL */}
                    <FormField
                      control={form.control}
                      name="apiUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://api.elevenlabs.io" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone ID */}
                    <FormField
                      control={form.control}
                      name="phoneId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Phone ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="phone_id_from_elevenlabs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Configuración Adicional */}
                <div className="space-y-4">
                  <div className="pb-2 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Configuración Adicional</h3>
                    <p className="text-sm text-muted-foreground">Ajustes opcionales y configuración de comportamiento</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Default Voice */}
                    <FormField
                      control={form.control}
                      name="defaultVoiceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voz Por Defecto</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  voices.length === 0 
                                    ? "Primero prueba la conexión para cargar voces" 
                                    : "Seleccionar voz"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {voices.length === 0 ? (
                                <SelectItem value="no-voices" disabled>
                                  No hay voces disponibles. Prueba la conexión primero.
                                </SelectItem>
                              ) : (
                                voices.map((voice) => (
                                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                    {voice.name} - {voice.category}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Timezone */}
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zona Horaria *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Bogota">América/Bogotá (GMT-5)</SelectItem>
                              <SelectItem value="America/Mexico_City">América/Ciudad_de_México (GMT-6)</SelectItem>
                              <SelectItem value="America/New_York">América/Nueva_York (GMT-5/-4)</SelectItem>
                              <SelectItem value="Europe/Madrid">Europa/Madrid (GMT+1/+2)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Horario de inicio */}
                    <FormField
                      control={form.control}
                      name="allowedCallHoursStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Inicio *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Horario de fin */}
                    <FormField
                      control={form.control}
                      name="allowedCallHoursEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Fin *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Llamadas concurrentes */}
                    <FormField
                      control={form.control}
                      name="maxConcurrentCalls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máx. Llamadas Concurrentes *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Límite de costo */}
                    <FormField
                      control={form.control}
                      name="costLimitPerMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Límite de Costo Mensual (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="5.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 5)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {isConfigured ? 'Actualizar' : 'Guardar'} Configuración
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex items-center gap-2"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Probar Conexión
                  </Button>

                  {isConfigured && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}

          {/* Resultado del test */}
          {testResult && (
            <div className="mt-6">
              <Alert className={`border-2 ${testResult.success 
                ? 'border-green-500 bg-green-50 text-green-900' 
                : 'border-red-500 bg-red-50 text-red-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <AlertDescription>
                  <div className="font-semibold text-base mb-3">{testResult.message}</div>
                  {testResult.details && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge 
                          variant={testResult.details.apiKeyValid ? 'default' : 'destructive'}
                          className={`px-3 py-1 ${testResult.details.apiKeyValid 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          API Key: {testResult.details.apiKeyValid ? '✅ Válida' : '❌ Inválida'}
                        </Badge>
                        <Badge 
                          variant={testResult.details.phoneIdValid ? 'default' : 'destructive'}
                          className={`px-3 py-1 ${testResult.details.phoneIdValid 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          Phone ID: {testResult.details.phoneIdValid ? '✅ Válido' : '❌ Inválido'}
                        </Badge>
                      </div>
                      {testResult.details.voicesAvailable > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                          <p className="text-blue-800 font-medium">
                            🎵 Voces disponibles: {testResult.details.voicesAvailable}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}