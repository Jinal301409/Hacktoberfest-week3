export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'engineering' | 'study' | 'work' | 'personal' | 'admin' | 'health' | 'other';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type SummaryMode = 'quick' | 'detailed' | 'key_points' | 'action_items' | 'simple';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type WorkStyle = 'pomodoro' | 'flow' | 'balanced';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes?: number;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  ambiguityNotice?: string;
  sourceNote?: string;
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'break' | 'review';
  title: string;
  description: string;
  durationMinutes: number;
  taskId?: string;
  energyRequired: EnergyLevel;
  pacingReason: string;
  completed?: boolean;
}

export interface DailyPlan {
  id: string;
  createdAt: string;
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

export interface ActivityItem {
  id: string;
  timestamp: string;
  action: 'quick_capture' | 'summarize' | 'extract_tasks' | 'plan_day' | 'organize_files';
  title: string;
  inputSnippet: string;
  provider: string;
  model: string;
  executionMs: number;
  isSimulated: boolean;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface AppSettings {
  preferredProvider: 'ollama' | 'gemini' | 'simulated';
  ollamaBaseUrl: string;
  ollamaModel: string;
  geminiModel: string;
  defaultEnergyLevel: EnergyLevel;
  defaultWorkHours: number;
  defaultWorkStyle: WorkStyle;
  enableNotifications: boolean;
  hasSeenOnboarding: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  provider: 'ollama' | 'gemini' | 'simulated';
  model: string;
  latencyMs: number | null;
  error?: string;
  availableModels: string[];
  checkedAt: string;
}
