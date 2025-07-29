'use client';

import { useState } from 'react';
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
import { 
  Bot, 
  X, 
  Plus, 
  Save, 
  Loader2,
  Settings,
  MessageSquare,
  Target,
  Volume2
} from 'lucide-react';
import { useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { ITenantElevenLabsAgent, ICreateAgentData, IUpdateAgentData } from '@/types/agents';

const agentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre muy largo'),
  description: z.string().min(1, 'La descripción es requerida').max(500, 'Descripción muy larga'),
  agentId: z.string().min(1, 'El Agent ID de ElevenLabs es requerido'),
  voiceId: z.string().min(1, 'La voz es requerida'),
  voiceName: z.string().min(1, 'El nombre de la voz es requerido'),
  stability: z.number().min(0).max(1),
  similarityBoost: z.number().min(0).max(1),
  style: z.number().min(0).max(1),
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

interface AgentFormProps {
  agent: ITenantElevenLabsAgent | null;
  onClose: () => void;
  onSave: () => void;
}

export function AgentForm({ agent, onClose, onSave }: AgentFormProps) {
  const { 
    voices, 
    createAgent, 
    updateAgent, 
    loading 
  } = useAgentsContext();

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(
    agent?.usage.targetScenarios || []
  );
  const [selectedRiskCategories, setSelectedRiskCategories] = useState<string[]>(
    agent?.usage.riskCategories || []
  );
  const [selectedClientStatuses, setSelectedClientStatuses] = useState<string[]>(
    agent?.usage.clientStatuses || []
  );

  const isEditing = !!agent;

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      description: agent?.description || '',
      agentId: agent?.elevenLabsConfig.agentId || '',
      voiceId: agent?.elevenLabsConfig.voice.voiceId || '',
      voiceName: agent?.elevenLabsConfig.voice.voiceName || '',
      stability: agent?.elevenLabsConfig.voice.stability || 0.75,
      similarityBoost: agent?.elevenLabsConfig.voice.similarityBoost || 0.75,
      style: agent?.elevenLabsConfig.voice.style || 0.0,
      model: agent?.elevenLabsConfig.conversation.model || 'eleven_turbo_v2',
      temperature: agent?.elevenLabsConfig.conversation.temperature || 0.7,
      maxTokens: agent?.elevenLabsConfig.conversation.maxTokens || 2000,
      systemPrompt: agent?.elevenLabsConfig.conversation.systemPrompt || '',
      firstMessage: agent?.elevenLabsConfig.conversation.firstMessage || '',
      daysOverdueMin: agent?.usage.daysOverdueRange.min || 0,
      daysOverdueMax: agent?.usage.daysOverdueRange.max || 30,
      priority: agent?.usage.priority || 5,
      tags: agent?.metadata.tags.join(', ') || ''
    }
  });

  const scenarios = [
    { id: 'overdue_payment', label: 'Pago Atrasado' },
    { id: 'follow_up', label: 'Seguimiento' },
    { id: 'reminder', label: 'Recordatorio' },
    { id: 'negotiation', label: 'Negociación' }
  ];

  const riskCategories = [
    { id: 'bajo', label: 'Bajo' },
    { id: 'medio', label: 'Medio' },
    { id: 'alto', label: 'Alto' }
  ];

  const clientStatuses = [
    { id: 'current', label: 'Al día' },
    { id: 'overdue', label: 'Vencido' },
    { id: 'paid', label: 'Pagado' }
  ];

  const onSubmit = async (data: AgentFormData) => {
    try {
      const agentData: ICreateAgentData | IUpdateAgentData = {
        name: data.name,
        description: data.description,
        elevenLabsConfig: {
          agentId: data.agentId,
          voice: {
            voiceId: data.voiceId,
            voiceName: data.voiceName,
            stability: data.stability,
            similarityBoost: data.similarityBoost,
            style: data.style
          },
          conversation: {
            model: data.model,
            temperature: data.temperature,
            maxTokens: data.maxTokens,
            systemPrompt: data.systemPrompt,
            firstMessage: data.firstMessage
          }
        },
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

      if (isEditing) {
        await updateAgent(agent.id, agentData);
      } else {
        await createAgent(agentData as ICreateAgentData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    const selectedVoice = voices.find(v => v.voice_id === voiceId);
    if (selectedVoice) {
      form.setValue('voiceId', voiceId);
      form.setValue('voiceName', selectedVoice.name);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {isEditing ? 'Editar Agente' : 'Crear Nuevo Agente'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Agente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Agente de Cobranza Suave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent ID de ElevenLabs *</FormLabel>
                      <FormControl>
                        <Input placeholder="agent_id_from_elevenlabs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el propósito y comportamiento de este agente..."
                        className="min-h-[80px]"
                        {...field} 
                      />
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
                      <Input placeholder="cobranza, suave, profesional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Configuración de Voz */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Configuración de Voz</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="voiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voz *</FormLabel>
                      <Select onValueChange={handleVoiceSelect} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar voz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} - {voice.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Configuración de Voz</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="stability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Estabilidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="similarityBoost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Similitud</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Estilo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Configuración de Conversación */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Configuración de Conversación</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="eleven_turbo_v2">Eleven Turbo V2</SelectItem>
                          <SelectItem value="eleven_monolingual_v1">Eleven Monolingual V1</SelectItem>
                          <SelectItem value="eleven_multilingual_v2">Eleven Multilingual V2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperatura</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máx. Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="8000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt del Sistema *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Eres un agente profesional de cobranza. Tu objetivo es..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje Inicial *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Buenos días, le hablo de la empresa..."
                        className="min-h-[80px]"
                        {...field} 
                      />
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
                          id={scenario.id}
                          checked={selectedScenarios.includes(scenario.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedScenarios([...selectedScenarios, scenario.id]);
                            } else {
                              setSelectedScenarios(selectedScenarios.filter(s => s !== scenario.id));
                            }
                          }}
                        />
                        <Label htmlFor={scenario.id} className="text-sm">
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
                          id={risk.id}
                          checked={selectedRiskCategories.includes(risk.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRiskCategories([...selectedRiskCategories, risk.id]);
                            } else {
                              setSelectedRiskCategories(selectedRiskCategories.filter(r => r !== risk.id));
                            }
                          }}
                        />
                        <Label htmlFor={risk.id} className="text-sm">
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
                          id={status.id}
                          checked={selectedClientStatuses.includes(status.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClientStatuses([...selectedClientStatuses, status.id]);
                            } else {
                              setSelectedClientStatuses(selectedClientStatuses.filter(s => s !== status.id));
                            }
                          }}
                        />
                        <Label htmlFor={status.id} className="text-sm">
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
                {isEditing ? 'Actualizar' : 'Crear'} Agente
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}