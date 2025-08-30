import { z } from "zod";

const AgentConfigSchema = z.object({
  apiKey: z.string().min(1, "ELEVENLABS_API_KEY is required"),
  agentId: z.string().min(1, "ELEVENLABS_AGENT_ID is required"), 
  phoneId: z.string().min(1, "ELEVENLABS_PHONE_ID is required"),
  apiUrl: z.string().url().default("https://api.elevenlabs.io"),
  voiceId: z.string().optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Get the static agent configuration from environment variables.
 * This replaces the dynamic agent selection system.
 * 
 * @throws {Error} If required configuration is missing or invalid
 */
export function getAgentConfig(): AgentConfig {
  const cfg = {
    apiKey: process.env.ELEVENLABS_API_KEY,
    agentId: process.env.ELEVENLABS_AGENT_ID,
    phoneId: process.env.ELEVENLABS_PHONE_ID,
    apiUrl: process.env.ELEVENLABS_API_URL || "https://api.elevenlabs.io",
    voiceId: process.env.ELEVENLABS_VOICE_ID,
  };

  try {
    return AgentConfigSchema.parse(cfg);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(e => e.message).join(', ');
      throw new Error(`Agent configuration invalid: ${missingFields}`);
    }
    throw error;
  }
}

/**
 * Check if agent configuration is available without throwing
 */
export function isAgentConfigured(): boolean {
  try {
    getAgentConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get configuration status for UI components
 */
export function getAgentConfigStatus() {
  try {
    const config = getAgentConfig();
    return {
      isConfigured: true,
      config,
      error: null,
    };
  } catch (error) {
    return {
      isConfigured: false,
      config: null,
      error: error instanceof Error ? error.message : 'Configuration error',
    };
  }
}