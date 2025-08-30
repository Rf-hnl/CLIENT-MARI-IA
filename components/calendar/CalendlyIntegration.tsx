/**
 * CALENDLY INTEGRATION COMPONENT
 * 
 * Componente para configuración y gestión de la integración con Calendly
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Settings,
  Link2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
  Users,
  Clock,
  Target,
  Sliders,
  Key
} from 'lucide-react';
import { CalendlyIntegrationSettings } from '@/types/calendly';

interface CalendlyIntegrationProps {
  tenantId: string;
  organizationId: string;
  className?: string;
}

export default function CalendlyIntegration({
  tenantId,
  organizationId,
  className = ""
}: CalendlyIntegrationProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CalendlyIntegrationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [accessToken, setAccessToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Estado para enlaces personalizados
  const [customLinks, setCustomLinks] = useState<{ [key: string]: string }>({});
  const [generatedLinks, setGeneratedLinks] = useState<Array<{
    id: string;
    leadName: string;
    leadEmail: string;
    eventType: string;
    link: string;
    score: number;
    sentiment: number;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    loadSettings();
    loadGeneratedLinks();
  }, [tenantId, organizationId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/calendar/calendly/schedule?tenantId=${tenantId}&organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success && data.config) {
        setSettings(data.config);
        setConnectionStatus('connected');
      } else {
        // Configuración por defecto
        setSettings({
          enabled: false,
          autoScheduling: false,
          eventTypeMapping: {
            demo: '',
            proposal: '',
            closing: '',
            follow_up: '',
            technical_call: '',
            discovery: ''
          },
          webhookUrl: `${window.location.origin}/api/calendar/calendly/webhook`,
          defaultDuration: 30,
          timezone: 'America/Mexico_City',
          bufferTime: 15,
          leadScoreThreshold: 70,
          sentimentThreshold: 0.3
        });
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Error loading Calendly settings:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGeneratedLinks = async () => {
    try {
      // Simulamos datos de enlaces generados
      // En implementación real, esto vendría de la API
      setGeneratedLinks([
        {
          id: '1',
          leadName: 'Juan Pérez',
          leadEmail: 'juan@empresa.com',
          eventType: 'demo',
          link: 'https://calendly.com/demo/juan-perez-85',
          score: 85,
          sentiment: 0.8,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          leadName: 'María González',
          leadEmail: 'maria@company.com',
          eventType: 'proposal',
          link: 'https://calendly.com/proposal/maria-gonzalez-78',
          score: 78,
          sentiment: 0.7,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading generated links:', error);
    }
  };

  const testConnection = async () => {
    if (!accessToken) return;
    
    try {
      setTestingConnection(true);
      // Aquí se implementaría la prueba de conexión con Calendly
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular llamada API
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/tenant/calendly-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          organizationId,
          config: settings
        })
      });

      if (response.ok) {
        // Éxito - podrías mostrar una notificación
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof CalendlyIntegrationSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateEventTypeMapping = (eventType: string, calendlyUrl: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      eventTypeMapping: {
        ...settings.eventTypeMapping,
        [eventType]: calendlyUrl
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías mostrar una notificación de éxito
  };

  const generatePersonalizedLink = async (leadId: string) => {
    try {
      const response = await fetch('/api/calendar/calendly/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          automated: false // Para generar link, no programar automáticamente
        })
      });

      const data = await response.json();
      if (data.success && data.schedulingUrl) {
        // Actualizar lista de enlaces generados
        loadGeneratedLinks();
        return data.schedulingUrl;
      }
    } catch (error) {
      console.error('Error generating personalized link:', error);
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Integración Calendly
            </div>
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className={connectionStatus === 'connected' ? 'bg-green-500' : ''}
            >
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus === 'error' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                Para activar la integración con Calendly, configura tu token de acceso y URLs de eventos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de configuración */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Enlaces
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automatización
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Configuración */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Credenciales de Calendly
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="access-token">Token de Acceso</Label>
                <div className="flex gap-2">
                  <Input
                    id="access-token"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Ingresa tu token de acceso de Calendly"
                    className="flex-1"
                  />
                  <Button 
                    onClick={testConnection}
                    disabled={!accessToken || testingConnection}
                    variant="outline"
                  >
                    {testingConnection ? 'Probando...' : 'Probar'}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="webhook-url">URL de Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={settings?.webhookUrl || ''}
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => copyToClipboard(settings?.webhookUrl || '')}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Configura esta URL como webhook en tu cuenta de Calendly
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mapeo de Tipos de Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings && Object.entries(settings.eventTypeMapping).map(([eventType, calendlyUrl]) => (
                <div key={eventType}>
                  <Label htmlFor={eventType} className="capitalize">
                    {eventType.replace('_', ' ')}
                  </Label>
                  <Input
                    id={eventType}
                    value={calendlyUrl}
                    onChange={(e) => updateEventTypeMapping(eventType, e.target.value)}
                    placeholder={`URL de Calendly para ${eventType}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Enlaces Personalizados */}
        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Enlaces Generados Recientemente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{link.leadName}</p>
                        <Badge variant="outline" className="text-xs">
                          {link.eventType}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Score: {link.score}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{link.leadEmail}</p>
                      <p className="text-xs text-blue-600 font-mono">{link.link}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(link.link)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(link.link, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {generatedLinks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay enlaces personalizados generados aún</p>
                    <p className="text-sm">Los enlaces se generarán automáticamente cuando los leads califiquen</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Automatización */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Configuración de Auto-Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Scheduling Activado</Label>
                  <p className="text-sm text-muted-foreground">
                    Programar reuniones automáticamente para leads calificados
                  </p>
                </div>
                <Switch
                  checked={settings?.autoScheduling || false}
                  onCheckedChange={(checked) => updateSetting('autoScheduling', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="score-threshold">Score Mínimo de Lead</Label>
                  <Input
                    id="score-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings?.leadScoreThreshold || 70}
                    onChange={(e) => updateSetting('leadScoreThreshold', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sentiment-threshold">Sentiment Mínimo</Label>
                  <Input
                    id="sentiment-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings?.sentimentThreshold || 0.3}
                    onChange={(e) => updateSetting('sentimentThreshold', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default-duration">Duración por Defecto (min)</Label>
                  <Input
                    id="default-duration"
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={settings?.defaultDuration || 30}
                    onChange={(e) => updateSetting('defaultDuration', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="buffer-time">Tiempo de Buffer (min)</Label>
                  <Input
                    id="buffer-time"
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={settings?.bufferTime || 15}
                    onChange={(e) => updateSetting('bufferTime', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Enlaces Generados
                </CardTitle>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generatedLinks.length}</div>
                <p className="text-xs text-muted-foreground">
                  Este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reuniones Programadas
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground">
                  78% vía Calendly
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasa de Conversión
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">
                  Link → Reunión programada
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}