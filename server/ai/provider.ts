import {
  QuickCaptureResponse,
  SummarizeResponse,
  DailyPlanResponse,
  FileOrganizeResponse,
  SummaryMode,
  EnergyLevel
} from '../types.js';

export interface ProviderStatus {
  connected: boolean;
  model: string;
  provider: 'ollama' | 'gemini' | 'simulated';
  availableModels: string[];
  latencyMs: number | null;
  error?: string;
}

export interface TaskInput {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedMinutes?: number;
  dueDate?: string;
}

export interface FileInput {
  name: string;
  size?: number;
  type?: string;
  previewSnippet?: string;
}

export interface AiProvider {
  name: 'ollama' | 'gemini' | 'simulated';
  displayName: string;
  isLocal: boolean;
  isSimulated: boolean;

  checkHealth(customUrl?: string, customModel?: string): Promise<ProviderStatus>;

  quickCapture(text: string, customModel?: string): Promise<QuickCaptureResponse>;

  summarize(
    text: string,
    mode: SummaryMode,
    fileName?: string,
    customModel?: string
  ): Promise<SummarizeResponse>;

  planDay(
    tasks: TaskInput[],
    availableHours: number,
    energyLevel: EnergyLevel,
    startHour: string,
    workStyle: string,
    customModel?: string
  ): Promise<DailyPlanResponse>;

  organizeFiles(
    files: FileInput[],
    contextHint?: string,
    customModel?: string
  ): Promise<FileOrganizeResponse>;
}
