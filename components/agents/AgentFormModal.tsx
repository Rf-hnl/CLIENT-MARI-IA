'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { ITenantElevenLabsAgent, ICreateAgentData, IAgentUsageRules, IAgentMetadata } from '@/types/agents';
import { IElevenLabsAgentInfo, IElevenLabsAgentConfig, IElevenLabsVoiceConfig, IElevenLabsConversationConfig } from '@/types/elevenlabs'; // Import ElevenLabs specific types directly
import { useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for metadata defaults

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentToEdit?: ITenantElevenLabsAgent | null;
}

// Define a simplified form state interface
interface IAgentFormState {
  name: string;
  description: string;
  elevenLabsAgentId: string;
  voiceId: string;
  llmModelId: string;
  systemPrompt: string;
  firstMessage: string;

  // Usage Rules
  targetScenarios: string[];
  daysOverdueMin: number;
  daysOverdueMax: number;
  riskCategories: string[];
  clientStatuses: string[];
  priority: number;

  // Metadata
  isActive: boolean;
  tags: string[];
}

export const AgentFormModal = ({ isOpen, onClose, agentToEdit }: AgentFormModalProps) => {
  const { createAgent, updateAgent } = useAgentsContext();
  const [formData, setFormData] = useState<IAgentFormState>({
    name: '',
    description: '',
    elevenLabsAgentId: '',
    voiceId: '',
    llmModelId: '',
    systemPrompt: '',
    firstMessage: '',
    targetScenarios: [],
    daysOverdueMin: 0,
    daysOverdueMax: 0,
    riskCategories: [],
    clientStatuses: [],
    priority: 5,
    isActive: true,
    tags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentToEdit) {
      setFormData({
        name: agentToEdit.name || '',
        description: agentToEdit.description || '',
        elevenLabsAgentId: agentToEdit.elevenLabsData?.agent_id || agentToEdit.elevenLabsConfig?.agentId || '',
        voiceId: agentToEdit.elevenLabsData?.conversation_config?.tts?.voice_id || agentToEdit.elevenLabsConfig?.voice?.voiceId || '',
        llmModelId: agentToEdit.elevenLabsData?.conversation_config?.agent?.prompt?.llm || agentToEdit.elevenLabsConfig?.conversation?.model || '',
        systemPrompt: agentToEdit.elevenLabsData?.conversation_config?.agent?.prompt?.prompt || agentToEdit.elevenLabsConfig?.conversation?.systemPrompt || '',
        firstMessage: agentToEdit.elevenLabsData?.conversation_config?.agent?.first_message || agentToEdit.elevenLabsConfig?.conversation?.firstMessage || '',
        targetScenarios: agentToEdit.usage?.targetScenarios || [],
        daysOverdueMin: agentToEdit.usage?.daysOverdueRange?.min || 0,
        daysOverdueMax: agentToEdit.usage?.daysOverdueRange?.max || 0,
        riskCategories: agentToEdit.usage?.riskCategories || [],
        clientStatuses: agentToEdit.usage?.clientStatuses || [],
        priority: agentToEdit.usage?.priority || 5,
        isActive: agentToEdit.metadata?.isActive || false,
        tags: agentToEdit.metadata?.tags || []
      });
    } else {
      // Reset form for new agent
      setFormData({
        name: '',
        description: '',
        elevenLabsAgentId: '',
        voiceId: '',
        llmModelId: '',
        systemPrompt: '',
        firstMessage: '',
        targetScenarios: [],
        daysOverdueMin: 0,
        daysOverdueMax: 0,
        riskCategories: [],
        clientStatuses: [],
        priority: 5,
        isActive: true,
        tags: []
      });
    }
    setError(null);
  }, [agentToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: 'targetScenarios' | 'riskCategories' | 'clientStatuses', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [value] // Assuming single select for now, adjust if multi-select is needed
    }));
  };

  const handleRangeChange = (field: 'daysOverdueMin' | 'daysOverdueMax', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Number(value)
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isActive: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.name || !formData.elevenLabsAgentId || !formData.voiceId || !formData.llmModelId || !formData.systemPrompt || !formData.firstMessage) {
        throw new Error('Todos los campos marcados con * son requeridos.');
      }

      // Construct IElevenLabsAgentInfo from formData
      const elevenLabsData: IElevenLabsAgentInfo = {
        agent_id: formData.elevenLabsAgentId,
        name: formData.name,
        conversation_config: {
          asr: { quality: 'default', provider: 'default', user_input_audio_format: 'default', keywords: [] },
          turn: { turn_timeout: 5000, silence_end_call_timeout: 10000, mode: 'default' },
          tts: {
            model_id: 'eleven_turbo_v2', // Default TTS model
            voice_id: formData.voiceId,
            supported_voices: [], agent_output_audio_format: 'mp3', optimize_streaming_latency: 3,
            stability: 0.5, speed: 1.0, similarity_boost: 0.5, pronunciation_dictionary_locators: []
          },
          conversation: { text_only: false, max_duration_seconds: 300, client_events: [] },
          agent: {
            first_message: formData.firstMessage,
            language: 'es', // Default language
            prompt: {
              prompt: formData.systemPrompt,
              llm: formData.llmModelId,
              temperature: 0.7, max_tokens: -1, tool_ids: []
            }
          }
        },
        metadata: { created_at_unix_secs: Math.floor(Date.now() / 1000) },
        platform_settings: {}, phone_numbers: [], workflow: {},
        access_info: { is_creator: true, creator_name: 'User', creator_email: 'user@example.com', role: 'admin' }, // Placeholder
        tags: formData.tags
      };

      // Construct IElevenLabsAgentConfig from formData (for local reference)
      const elevenLabsConfig: IElevenLabsAgentConfig = {
        agentId: formData.elevenLabsAgentId,
        voice: {
          voiceId: formData.voiceId,
          voiceName: 'Custom Voice', // Placeholder
          stability: 0.5, similarityBoost: 0.5, style: 0.5
        },
        conversation: {
          model: formData.llmModelId,
          temperature: 0.7, maxTokens: -1,
          systemPrompt: formData.systemPrompt,
          firstMessage: formData.firstMessage
        }
      };

      // Construct IAgentUsageRules from formData
      const usage: IAgentUsageRules = {
        targetScenarios: formData.targetScenarios,
        daysOverdueRange: { min: formData.daysOverdueMin, max: formData.daysOverdueMax },
        riskCategories: formData.riskCategories,
        clientStatuses: formData.clientStatuses,
        priority: formData.priority
      };

      // Construct IAgentMetadata from formData
      const metadata: IAgentMetadata = {
        isActive: formData.isActive,
        tags: formData.tags,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'current_user_id', // Placeholder for current user
        version: '1.0.0'
      };

      let result;
      if (agentToEdit && agentToEdit.id) {
        // Update existing agent
        result = await updateAgent(agentToEdit.id, {
          ...agentToEdit, // Spread existing agent data to preserve non-form fields
          name: formData.name,
          description: formData.description,
          elevenLabsData: elevenLabsData,
          elevenLabsConfig: elevenLabsConfig,
          usage: usage,
          metadata: metadata
        });
      } else {
        // Create new agent
        const newAgentData: ICreateAgentData = {
          elevenLabsAgentId: formData.elevenLabsAgentId,
          usage: usage,
          tags: formData.tags,
        };
        result = await createAgent(newAgentData);
      }

      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        setError(result.error || 'Error desconocido al guardar el agente.');
        toast.error(result.error || 'Error desconocido al guardar el agente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el agente.');
      toast.error(err.message || 'Error al guardar el agente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agentToEdit ? 'Editar Agente' : 'Crear Nuevo Agente'}</DialogTitle>
          <DialogDescription>
            {agentToEdit ? 'Modifica los detalles de tu agente existente.' : 'Configura un nuevo agente para tus llamadas automatizadas.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Basic Info */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              className="col-span-3"
              rows={3}
            />
          </div>

          {/* ElevenLabs Configuration */}
          <h3 className="text-lg font-semibold mt-4 col-span-4">Configuración ElevenLabs</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="elevenLabsAgentId" className="text-right">
              ElevenLabs Agent ID
            </Label>
            <Input
              id="elevenLabsAgentId"
              value={formData.elevenLabsAgentId}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="voiceId" className="text-right">
              Voice ID (TTS)
            </Label>
            <Input
              id="voiceId"
              value={formData.voiceId}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="llmModelId" className="text-right">
              Model ID (LLM)
            </Label>
            <Input
              id="llmModelId"
              value={formData.llmModelId}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="systemPrompt" className="text-right">
              System Prompt
            </Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={handleChange}
              className="col-span-3"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstMessage" className="text-right">
              Primer Mensaje
            </Label>
            <Textarea
              id="firstMessage"
              value={formData.firstMessage}
              onChange={handleChange}
              className="col-span-3"
              rows={2}
              required
            />
          </div>

          {/* Usage Rules */}
          <h3 className="text-lg font-semibold mt-4 col-span-4">Reglas de Uso</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetScenarios" className="text-right">
              Escenarios
            </Label>
            <Select
              value={formData.targetScenarios?.[0] || ''} // Assuming single select for simplicity
              onValueChange={(value) => handleSelectChange('targetScenarios', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona escenarios..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overdue_payment">Pago Atrasado</SelectItem>
                <SelectItem value="follow_up">Seguimiento</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
                <SelectItem value="negotiation">Negociación</SelectItem>
                <SelectItem value="request_info">Solicitar Información</SelectItem>
                <SelectItem value="general_inquiry">Consulta General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientStatuses" className="text-right">
              Estados de Cliente
            </Label>
            <Select
              value={formData.clientStatuses?.[0] || ''} // Assuming single select
              onValueChange={(value) => handleSelectChange('clientStatuses', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona estados..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Al día</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="daysOverdueMin" className="text-right">
              Días Atraso (Min)
            </Label>
            <Input
              id="daysOverdueMin"
              type="number"
              value={formData.daysOverdueMin}
              onChange={(e) => handleRangeChange('daysOverdueMin', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="daysOverdueMax" className="text-right">
              Días Atraso (Max)
            </Label>
            <Input
              id="daysOverdueMax"
              type="number"
              value={formData.daysOverdueMax}
              onChange={(e) => handleRangeChange('daysOverdueMax', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="riskCategories" className="text-right">
              Categorías de Riesgo
            </Label>
            <Select
              value={formData.riskCategories?.[0] || ''} // Assuming single select
              onValueChange={(value) => handleSelectChange('riskCategories', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona categorías..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bajo">Bajo</SelectItem>
                <SelectItem value="medio">Medio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Prioridad (1-10)
            </Label>
            <Input
              id="priority"
              type="number"
              min={1}
              max={10}
              value={formData.priority}
              onChange={(e) => handleChange(e)} // Use generic handleChange
              className="col-span-3"
            />
          </div>

          {/* Metadata */}
          <h3 className="text-lg font-semibold mt-4 col-span-4">Metadata</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Activo
            </Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Etiquetas (separadas por coma)
            </Label>
            <Input
              id="tags"
              value={formData.tags.join(', ')}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                agentToEdit ? 'Guardar Cambios' : 'Crear Agente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
