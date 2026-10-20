import {
  QuickCaptureResponse,
  SummarizeResponse,
  DailyPlanResponse,
  FileOrganizeResponse,
  AiStatusResponse,
  SummaryMode,
  EnergyLevel
} from '../../server/types.js';

export interface QuickCapturePayload {
  text: string;
  provider?: 'ollama' | 'gemini' | 'simulated';
  model?: string;
}

export interface SummarizePayload {
  text: string;
  mode: SummaryMode;
  fileName?: string;
  provider?: 'ollama' | 'gemini' | 'simulated';
  model?: string;
}

export interface PlanDayPayload {
  tasks: Array<{
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes?: number;
    dueDate?: string;
  }>;
  availableHours: number;
  energyLevel: EnergyLevel;
  startHour?: string;
  workStyle?: 'pomodoro' | 'flow' | 'balanced';
  provider?: 'ollama' | 'gemini' | 'simulated';
  model?: string;
}

export interface OrganizeFilesPayload {
  files: Array<{
    name: string;
    size?: number;
    type?: string;
    previewSnippet?: string;
  }>;
  contextHint?: string;
  provider?: 'ollama' | 'gemini' | 'simulated';
  model?: string;
}

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getAiStatus(url?: string, model?: string): Promise<AiStatusResponse> {
    const query = new URLSearchParams();
    if (url) query.set('url', url);
    if (model) query.set('model', model);
    const res = await fetch(`/api/ai/status?${query.toString()}`);
    if (!res.ok) throw new Error(`AI status check failed: ${res.statusText}`);
    return res.json();
  },

  async testConnection(ollamaBaseUrl: string, model: string): Promise<AiStatusResponse> {
    const res = await fetch('/api/ai/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ollamaBaseUrl, model }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Connection test failed: ${res.statusText}`);
    }
    return res.json();
  },

  async quickCapture(payload: QuickCapturePayload): Promise<QuickCaptureResponse> {
    const res = await fetch('/api/ai/quick-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Quick capture failed');
    }
    return res.json();
  },

  async summarize(payload: SummarizePayload): Promise<SummarizeResponse> {
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Summarization failed');
    }
    return res.json();
  },

  async planDay(payload: PlanDayPayload): Promise<DailyPlanResponse> {
    const res = await fetch('/api/ai/plan-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Daily plan generation failed');
    }
    return res.json();
  },

  async organizeFiles(payload: OrganizeFilesPayload): Promise<FileOrganizeResponse> {
    const res = await fetch('/api/ai/organize-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'File organization failed');
    }
    return res.json();
  },
};
