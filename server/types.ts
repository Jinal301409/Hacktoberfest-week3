export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'engineering' | 'study' | 'work' | 'personal' | 'admin' | 'health' | 'other';
export type SummaryMode = 'quick' | 'detailed' | 'key_points' | 'action_items' | 'simple';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface ExtractedTask {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: Priority;
  estimatedMinutes?: number;
  dueDate?: string; // ISO date string or human label
  ambiguityNotice?: string; // Flag if date or details were ambiguous
  accepted?: boolean;
}

export interface QuickCaptureResponse {
  summary: string;
  tasks: ExtractedTask[];
  clarificationsNeeded: string[];
  meta: {
    provider: string;
    model: string;
    executionMs: number;
    isSimulated: boolean;
  };
}

export interface SummarizeResponse {
  mode: SummaryMode;
  headline: string;
  summary: string;
  keyPoints?: string[];
  actionItems?: string[];
  readingTimeMinutes: number;
  wordCount: number;
  meta: {
    provider: string;
    model: string;
    executionMs: number;
    isSimulated: boolean;
  };
}

export interface TimeBlock {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:45"
  type: 'work' | 'break' | 'review';
  title: string;
  description: string;
  durationMinutes: number;
  taskId?: string;
  energyRequired: EnergyLevel;
  pacingReason: string;
}

export interface DailyPlanResponse {
  targetHours: number;
  energyLevel: EnergyLevel;
  scheduleOverview: string;
  pacingRationale: string;
  blocks: TimeBlock[];
  lowEnergyAlternative: {
    summary: string;
    blocksToDefer: string[];
    tips: string[];
  };
  meta: {
    provider: string;
    model: string;
    executionMs: number;
    isSimulated: boolean;
  };
}

export interface FileSuggestion {
  originalName: string;
  suggestedName: string;
  suggestedFolder: string;
  category: string;
  reason: string;
  confidence: number;
}

export interface FileOrganizeResponse {
  summary: string;
  suggestions: FileSuggestion[];
  recommendedDirectoryTree: string[];
  meta: {
    provider: string;
    model: string;
    executionMs: number;
    isSimulated: boolean;
  };
}

export interface AiStatusResponse {
  connected: boolean;
  provider: 'ollama' | 'gemini' | 'simulated';
  model: string;
  ollamaBaseUrl: string;
  availableModels: string[];
  latencyMs: number | null;
  error?: string;
  instructions: {
    runCommand: string;
    pullCommand: string;
    offlineCapable: boolean;
  };
}
