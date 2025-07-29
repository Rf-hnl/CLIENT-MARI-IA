'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Zap, 
  Phone, 
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface WelcomeCardProps {
  onGetStarted: () => void;
}

export function WelcomeCard({ onGetStarted }: WelcomeCardProps) {
  const features = [
    {
      icon: <Bot className="h-5 w-5 text-blue-500" />,
      title: "Agentes Inteligentes",
      description: "Crea agentes de IA especializados para diferentes escenarios de cobranza"
    },
    {
      icon: <Phone className="h-5 w-5 text-green-500" />,
      title: "Llamadas Automatizadas",
      description: "Realiza llamadas automáticas con voces naturales de ElevenLabs"
    },
    {
      icon: <Target className="h-5 w-5 text-purple-500" />,
      title: "Segmentación Inteligente",
      description: "Los agentes se seleccionan automáticamente según el perfil del cliente"
    },
    {
      icon: <Zap className="h-5 w-5 text-orange-500" />,
      title: "Resultados en Tiempo Real",
      description: "Monitorea el desempeño y obtén estadísticas detalladas"
    }
  ];

  const agentTypes = [
    { name: "Cobranza Suave", description: "Para clientes con atrasos menores", color: "bg-green-100 text-green-800" },
    { name: "Cobranza Firme", description: "Para casos de mora prolongada", color: "bg-orange-100 text-orange-800" },
    { name: "Recordatorio", description: "Preventivo antes del vencimiento", color: "bg-blue-100 text-blue-800" },
    { name: "Negociación", description: "Para casos complejos", color: "bg-purple-100 text-purple-800" }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="h-10 w-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ¡Bienvenido a Agentes IA!
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Revoluciona tu proceso de cobranza con agentes de inteligencia artificial que realizan llamadas automatizadas, 
                personalizadas y efectivas las 24 horas del día.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by ElevenLabs
              </Badge>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                IA Avanzada
              </Badge>
            </div>
            
            <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Comenzar Configuración
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-gray-50">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Types Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tipos de Agentes Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agentTypes.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div>
                  <h4 className="font-medium">{agent.name}</h4>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
                <Badge className={agent.color}>
                  Listo
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">¿Listo para comenzar?</h3>
            <p className="text-blue-100">
              Configura tu conexión con ElevenLabs y crea tu primer agente en menos de 5 minutos.
            </p>
            <Button 
              onClick={onGetStarted}
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Configurar ElevenLabs Ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}