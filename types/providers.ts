// Basic provider types for the remaining functionality

export type AnalysisProvider = 'openai' | 'gemini' | 'claude';

export interface ProviderModel {
  name: string;
  displayName: string;
  description?: string;
  supportsGenerativeContent?: boolean;
  contextWindow?: number;
  version?: string;
}