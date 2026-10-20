import { Task, DailyPlan, ActivityItem, AppSettings } from '../types/index.js';

const STORAGE_KEYS = {
  TASKS: 'lazyflow_tasks_v1',
  ACTIVE_PLAN: 'lazyflow_active_plan_v1',
  ACTIVITY: 'lazyflow_activity_v1',
  SETTINGS: 'lazyflow_settings_v1',
  IS_SAMPLE_DATA: 'lazyflow_is_sample_data_v1',
};

export const INITIAL_SETTINGS: AppSettings = {
  preferredProvider: 'simulated',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'gemma2:2b',
  geminiModel: 'gemini-2.5-flash',
  defaultEnergyLevel: 'medium',
  defaultWorkHours: 6,
  defaultWorkStyle: 'balanced',
  enableNotifications: true,
  hasSeenOnboarding: false,
};

export const SAMPLE_TASKS: Task[] = [
  {
    id: 'sample-task-1',
    title: 'Finalize Hacktoberfest Open-Source AI submission',
    description: 'Ensure README has Ollama setup guide and privacy breakdown.',
    category: 'engineering',
    priority: 'high',
    status: 'in_progress',
    estimatedMinutes: 45,
    dueDate: 'This Friday',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ambiguityNotice: undefined,
  },
  {
    id: 'sample-task-2',
    title: 'Review DBMS lecture slides for viva',
    description: 'Focus on indexing, B+ trees, and transaction isolation levels.',
    category: 'study',
    priority: 'high',
    status: 'todo',
    estimatedMinutes: 60,
    dueDate: 'Tomorrow',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    ambiguityNotice: 'Exact viva slot time unconfirmed',
  },
  {
    id: 'sample-task-3',
    title: 'Draft client weekly milestone update',
    description: 'Send brief summary of automated workflow pipeline progress.',
    category: 'work',
    priority: 'medium',
    status: 'completed',
    estimatedMinutes: 25,
    dueDate: 'Today (EOD)',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sample-task-4',
    title: 'Hydration and afternoon walk break',
    description: 'Rest eyes from monitors, 15-minute gentle stroll.',
    category: 'health',
    priority: 'medium',
    status: 'todo',
    estimatedMinutes: 15,
    dueDate: 'Today (3:00 PM)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sample-task-5',
    title: 'Organize research papers in local directory',
    description: 'Clean up chaotic downloads into categorized academic folders.',
    category: 'admin',
    priority: 'low',
    status: 'todo',
    estimatedMinutes: 20,
    dueDate: 'This Weekend',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const SAMPLE_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-sample-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    action: 'quick_capture',
    title: 'Quick Brain Dump Extraction',
    inputSnippet: 'finish dbms assignment by friday, prepare for viva, email team...',
    provider: 'Gemma 2:2b (Ollama Local)',
    model: 'gemma2:2b',
    executionMs: 642,
    isSimulated: false,
    status: 'success',
  },
  {
    id: 'act-sample-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    action: 'plan_day',
    title: 'Lazy Mode Daily Rhythm Generation',
    inputSnippet: 'Schedule 4 tasks for Medium energy across 6 hours with breaks',
    provider: 'Gemma 2:2b (Ollama Local)',
    model: 'gemma2:2b',
    executionMs: 820,
    isSimulated: false,
    status: 'success',
  },
  {
    id: 'act-sample-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    action: 'summarize',
    title: 'Document Key Points Extraction',
    inputSnippet: 'Architecture RFC on Open-Weight Local Inference',
    provider: 'Simulated Gemma (Demo Mode)',
    model: 'gemma2:2b (Simulated)',
    executionMs: 512,
    isSimulated: true,
    status: 'success',
  },
];

export const storage = {
  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        this.saveTasks(SAMPLE_TASKS);
        this.setIsSampleData(true);
        return SAMPLE_TASKS;
      }
      return JSON.parse(data);
    } catch {
      return SAMPLE_TASKS;
    }
  },

  saveTasks(tasks: Task[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  },

  getActivePlan(): DailyPlan | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveActivePlan(plan: DailyPlan | null) {
    try {
      if (!plan) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAN);
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(plan));
      }
    } catch (e) {
      console.error('Failed to save active plan:', e);
    }
  },

  getActivity(): ActivityItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (!data) {
        this.saveActivity(SAMPLE_ACTIVITY);
        return SAMPLE_ACTIVITY;
      }
      return JSON.parse(data);
    } catch {
      return SAMPLE_ACTIVITY;
    }
  },

  saveActivity(activity: ActivityItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activity));
    } catch (e) {
      console.error('Failed to save activity:', e);
    }
  },

  logActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>) {
    const list = this.getActivity();
    const newItem: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newItem);
    // Keep last 100 items
    this.saveActivity(list.slice(0, 100));
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...INITIAL_SETTINGS, ...JSON.parse(data) } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getIsSampleData(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_SAMPLE_DATA) === 'true';
  },

  setIsSampleData(val: boolean) {
    localStorage.setItem(STORAGE_KEYS.IS_SAMPLE_DATA, val ? 'true' : 'false');
  },

  clearSampleData() {
    this.saveTasks([]);
    this.saveActivePlan(null);
    this.saveActivity([]);
    this.setIsSampleData(false);
  },

  resetToSampleData() {
    this.saveTasks(SAMPLE_TASKS);
    this.saveActivity(SAMPLE_ACTIVITY);
    this.setIsSampleData(true);
  },
};
