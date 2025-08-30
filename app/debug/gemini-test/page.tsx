'use client';

/**
 * PÁGINA DE DEBUG PARA PROBAR GEMINI
 * Solo para desarrollo - eliminar en producción
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, AlertCircle, CheckCircle } from 'lucide-react';

export default function GeminiTestPage() {
  const [apiKey, setApiKey] = useState('');
  const [isTestingBasic, setIsTestingBasic] = useState(false);
  const [isTestingModels, setIsTestingModels] = useState(false);
  const [basicResult, setBasicResult] = useState<any>(null);
  const [modelsResult, setModelsResult] = useState<any>(null);

  const handleBasicTest = async () => {
    if (!apiKey) {
      alert('Introduce una API Key');
      return;
    }

    setIsTestingBasic(true);
    setBasicResult(null);

    try {
      const response = await fetch('/api/providers/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();
      setBasicResult(data);

    } catch (error) {
      setBasicResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error de red'
      });
    } finally {
      setIsTestingBasic(false);
    }
  };

  const handleModelsTest = async () => {
    if (!apiKey) {
      alert('Introduce una API Key');
      return;
    }

    setIsTestingModels(true);
    setModelsResult(null);

    try {
      const response = await fetch('/api/providers/gemini/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();
      setModelsResult(data);

    } catch (error) {
      setModelsResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error de red'
      });
    } finally {
      setIsTestingModels(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Gemini API Test</h1>
        <p className="text-muted-foreground">
          Página de debug para probar la conexión con Google Gemini
        </p>
      </div>

      {/* API Key Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="apiKey">Google Gemini API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AI..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Obtén tu API Key en: https://ai.google.dev/tutorials/setup
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tests */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Test Básico */}
        <Card>
          <CardHeader>
            <CardTitle>Test Básico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prueba conexión, inicialización y generación simple
            </p>
            
            <Button 
              onClick={handleBasicTest}
              disabled={isTestingBasic || !apiKey}
              className="w-full"
            >
              {isTestingBasic ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Ejecutar Test Básico
                </>
              )}
            </Button>

            {basicResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {basicResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={basicResult.success ? "default" : "destructive"}>
                    {basicResult.success ? "Éxito" : "Error"}
                  </Badge>
                </div>
                
                <Textarea
                  value={JSON.stringify(basicResult, null, 2)}
                  readOnly
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Modelos */}
        <Card>
          <CardHeader>
            <CardTitle>Test Modelos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prueba la obtención de lista de modelos disponibles
            </p>
            
            <Button 
              onClick={handleModelsTest}
              disabled={isTestingModels || !apiKey}
              className="w-full"
            >
              {isTestingModels ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando modelos...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Obtener Modelos
                </>
              )}
            </Button>

            {modelsResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {modelsResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={modelsResult.success ? "default" : "destructive"}>
                    {modelsResult.success ? "Éxito" : "Error"}
                  </Badge>
                  {modelsResult.success && modelsResult.totalCount && (
                    <Badge variant="outline">
                      {modelsResult.totalCount} modelos
                    </Badge>
                  )}
                </div>
                
                <Textarea
                  value={JSON.stringify(modelsResult, null, 2)}
                  readOnly
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ℹ️ Información de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Endpoints:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>POST /api/providers/gemini/test</code> - Test básico</li>
              <li><code>POST /api/providers/gemini/models</code> - Obtener modelos</li>
            </ul>
            <p className="mt-4"><strong>Errores comunes:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>API Key inválida - Verifica que la key sea correcta</li>
              <li>Permisos insuficientes - Habilita Gemini API en Google Cloud</li>
              <li>Cuota excedida - Verifica límites en Google Cloud Console</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Nota:</strong> Esta página es solo para desarrollo. 
          Eliminar antes de producción.
        </p>
      </div>
    </div>
  );
}