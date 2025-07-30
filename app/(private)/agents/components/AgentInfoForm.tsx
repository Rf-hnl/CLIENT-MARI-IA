'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  X, 
  Save, 
  Loader2,
  Settings,
  MessageSquare,
  Target,
  Volume2,
  Eye,
  Lock
} from 'lucide-react';
import { useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { ITenantElevenLabsAgent, ICreateAgentData } from '@/types/agents';
import { IElevenLabsAgentInfo } from '@/types/elevenlabs';

const agentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre muy largo'),
  voiceId: z.string().min(1, 'La voz es requerida'),
  stability: z.number().min(0).max(1),
  similarityBoost: z.number().min(0).max(1),
  model: z.string().min(1, 'El modelo es requerido'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8000),
  systemPrompt: z.string().min(1, 'El prompt del sistema es requerido'),
  firstMessage: z.string().min(1, 'El mensaje inicial es requerido'),
  daysOverdueMin: z.number().min(-30).max(365),
  daysOverdueMax: z.number().min(-30).max(365),
  priority: z.number().min(1).max(10),
  tags: z.string()
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentInfoFormProps {
  open: boolean;
  agentId: string;
  onClose: () => void;
  onSave: () => void;
}

export function AgentInfoForm({ 
  open, 
  agentId,
  onClose, 
  onSave
}: AgentInfoFormProps) {
  const { 
    voices, 
    createAgent, 
    loading,
    fetchAgentInfo,
    updateAgentInElevenLabs
  } = useAgentsContext();

  const [agentInfo, setAgentInfo] = useState<IElevenLabsAgentInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [selectedRiskCategories, setSelectedRiskCategories] = useState<string[]>([]);
  const [selectedClientStatuses, setSelectedClientStatuses] = useState<string[]>([]);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      voiceId: '',
      stability: 0.5,
      similarityBoost: 0.8,
      model: 'eleven_turbo_v2_5',
      temperature: 0,
      maxTokens: -1,
      systemPrompt: '',
      firstMessage: '',
      daysOverdueMin: 0,
      daysOverdueMax: 30,
      priority: 5,
      tags: ''
    }
  });

  const scenarios = [
    { id: 'overdue_payment', label: 'Pago Atrasado' },
    { id: 'follow_up', label: 'Seguimiento' },
    { id: 'reminder', label: 'Recordatorio' },
    { id: 'negotiation', label: 'Negociación' }
  ];

  // ✅ CORREGIDO: Compatible con modelo de clientes
  const riskCategories = [
    { id: 'prime', label: 'Prime (Bajo Riesgo)' },
    { id: 'near-prime', label: 'Near-Prime (Riesgo Medio)' },
    { id: 'subprime', label: 'Subprime (Alto Riesgo)' }
  ];

  const clientStatuses = [
    { id: 'current', label: 'Al día' },
    { id: 'overdue', label: 'Vencido' }
    // ❌ REMOVIDO: 'paid' no existe en el modelo de clientes real
  ];

  // Cargar información del agente cuando se abre el modal
  useEffect(() => {
    if (open && agentId) {
      loadAgentInfo();
    }
  }, [open, agentId]);

  const loadAgentInfo = async () => {
    setLoadingInfo(true);
    setInfoError(null);
    
    try {
      const result = await fetchAgentInfo(agentId);
      if (result.success && result.agent) {
        setAgentInfo(result.agent);
        
        // Pre-llenar todos los campos con la información del agente
        const agent = result.agent;
        form.setValue('name', agent.name || '');
        form.setValue('voiceId', agent.conversation_config?.tts?.voice_id || '');
        form.setValue('stability', agent.conversation_config?.tts?.stability ?? 0.5);
        form.setValue('similarityBoost', agent.conversation_config?.tts?.similarity_boost ?? 0.8);
        form.setValue('model', agent.conversation_config?.tts?.model_id || 'eleven_turbo_v2_5');
        form.setValue('temperature', agent.conversation_config?.agent?.prompt?.temperature ?? 0);
        form.setValue('maxTokens', agent.conversation_config?.agent?.prompt?.max_tokens ?? -1);
        form.setValue('systemPrompt', agent.conversation_config?.agent?.prompt?.prompt || '');
        form.setValue('firstMessage', agent.conversation_config?.agent?.first_message || '');
      } else {
        setInfoError(result.error || 'Error al cargar información del agente');
      }
    } catch (error) {
      console.error('Error loading agent info:', error);
      setInfoError(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setLoadingInfo(false);
    }
  };

  const onSubmit = async (data: AgentFormData) => {
    if (!agentInfo) return;
    
    try {
      // Primero actualizar el agente en ElevenLabs
      await updateAgentInElevenLabs(agentInfo.agent_id, {
        name: data.name,
        first_message: data.firstMessage,
        system_prompt: data.systemPrompt,
        voice_id: data.voiceId,
        stability: data.stability,
        similarity_boost: data.similarityBoost,
        temperature: data.temperature,
        max_tokens: data.maxTokens
      });

      // Luego crear/guardar la referencia local con la configuración actualizada
      const agentData: ICreateAgentData = {
        elevenLabsAgentId: agentInfo.agent_id,
        usage: {
          targetScenarios: selectedScenarios,
          daysOverdueRange: {
            min: data.daysOverdueMin,
            max: data.daysOverdueMax
          },
          riskCategories: selectedRiskCategories,
          clientStatuses: selectedClientStatuses,
          priority: data.priority
        },
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      await createAgent(agentData);
      onSave();
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };

  const selectedVoice = voices.find(v => v.voice_id === agentInfo?.conversation_config?.tts?.voice_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Conectar Agente Existente
          </DialogTitle>
        </DialogHeader>

        {loadingInfo ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Cargando información del agente...</span>
          </div>
        ) : infoError ? (
          <Alert className="border-red-500 bg-red-50">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {infoError}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setInfoError(null)}
                className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
              >
                Cerrar
              </Button>
            </AlertDescription>
          </Alert>
        ) : agentInfo ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Información del Agente (Solo lectura) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Información del Agente</h3>
                  <Badge variant="secondary" className="ml-auto">
                    <Lock className="h-3 w-3 mr-1" />
                    Solo lectura
                  </Badge>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Agent ID</Label>
                      <p className="text-sm font-mono bg-white p-2 rounded border">{agentInfo.agent_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nombre Original</Label>
                      <p className="text-sm bg-white p-2 rounded border">{agentInfo.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Modelo</Label>
                      <p className="text-sm bg-white p-2 rounded border">{agentInfo.conversation_config?.tts?.model_id || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Voz</Label>
                      <p className="text-sm bg-white p-2 rounded border">
                        {selectedVoice ? `${selectedVoice.name} (${selectedVoice.category})` : agentInfo.conversation_config?.tts?.voice_id || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Prompt del Sistema</Label>
                    <div className="text-sm bg-white p-3 rounded border max-h-32 overflow-y-auto">
                      {agentInfo.conversation_config?.agent?.prompt?.prompt || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Primer Mensaje</Label>
                    <div className="text-sm bg-white p-3 rounded border max-h-24 overflow-y-auto">
                      {agentInfo.conversation_config?.agent?.first_message || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configuración Local (Editable) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Configuración Local</h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre para mostrar *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del agente en el sistema" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiquetas (separadas por comas)</FormLabel>
                      <FormControl>
                        <Input placeholder="cobranza, elevenlabs, importado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Reglas de Uso */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Reglas de Uso</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Escenarios */}
                  <div className="space-y-3">
                    <Label>Escenarios de Uso</Label>
                    <div className="space-y-2">
                      {scenarios.map(scenario => (
                        <div key={scenario.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedScenarios.includes(scenario.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedScenarios([...selectedScenarios, scenario.id]);
                              } else {
                                setSelectedScenarios(selectedScenarios.filter(s => s !== scenario.id));
                              }
                            }}
                          />
                          <Label className="text-sm">
                            {scenario.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categorías de Riesgo */}
                  <div className="space-y-3">
                    <Label>Categorías de Riesgo</Label>
                    <div className="space-y-2">
                      {riskCategories.map(risk => (
                        <div key={risk.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedRiskCategories.includes(risk.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRiskCategories([...selectedRiskCategories, risk.id]);
                              } else {
                                setSelectedRiskCategories(selectedRiskCategories.filter(r => r !== risk.id));
                              }
                            }}
                          />
                          <Label className="text-sm">
                            {risk.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estados de Cliente */}
                  <div className="space-y-3">
                    <Label>Estados de Cliente</Label>
                    <div className="space-y-2">
                      {clientStatuses.map(status => (
                        <div key={status.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedClientStatuses.includes(status.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClientStatuses([...selectedClientStatuses, status.id]);
                              } else {
                                setSelectedClientStatuses(selectedClientStatuses.filter(s => s !== status.id));
                              }
                            }}
                          />
                          <Label className="text-sm">
                            {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuración de días y prioridad */}
                  <div className="space-y-4">
                    <div>
                      <Label>Rango de Días de Atraso</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <FormField
                          control={form.control}
                          name="daysOverdueMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span>a</span>
                        <FormField
                          control={form.control}
                          name="daysOverdueMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span>días</span>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridad (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Conectar Agente
                </Button>
              </div>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}