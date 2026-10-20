import { GoogleGenAI } from '@google/genai';
import { AiProvider, ProviderStatus, TaskInput, FileInput } from './provider.js';
import {
  QuickCaptureResponse,
  SummarizeResponse,
  DailyPlanResponse,
  FileOrganizeResponse,
  SummaryMode,
  EnergyLevel
} from '../types.js';

export class GeminiProvider implements AiProvider {
  name = 'gemini' as const;
  displayName = 'Google Gemini API (Hosted Fallback — Non-Open-Weight)';
  isLocal = false;
  isSimulated = false;

  private defaultModel = 'gemini-2.5-flash';
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment. Set it in .env or switch to Ollama / Simulated mode.');
    }
    return new GoogleGenAI({ apiKey });
  }

  private cleanJson(raw: string): string {
    let text = raw.trim();
    if (text.startsWith('```json')) {
      text = text.substring(7);
    } else if (text.startsWith('```')) {
      text = text.substring(3);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    return text.trim();
  }

  async checkHealth(_customUrl?: string, customModel?: string): Promise<ProviderStatus> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = customModel || this.defaultModel;

    if (!apiKey) {
      return {
        connected: false,
        model,
        provider: 'gemini',
        availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        latencyMs: null,
        error: 'GEMINI_API_KEY environment variable is not set.',
      };
    }

    const start = Date.now();
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model,
        contents: 'Ping',
      });
      const latencyMs = Date.now() - start;
      return {
        connected: Boolean(response.text),
        model,
        provider: 'gemini',
        availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        latencyMs,
      };
    } catch (err: any) {
      return {
        connected: false,
        model,
        provider: 'gemini',
        availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        latencyMs: null,
        error: err.message || 'Gemini API call failed',
      };
    }
  }

  async quickCapture(text: string, customModel?: string): Promise<QuickCaptureResponse> {
    const ai = this.getClient();
    const model = customModel || this.defaultModel;
    const start = Date.now();

    const response = await ai.models.generateContent({
      model,
      contents: `You are LazyFlow AI. Transform these unstructured messy notes into structured tasks.
Rules:
1. Extract concrete tasks.
2. If due dates are explicitly mentioned, extract them. If ambiguous, flag in ambiguityNotice.
3. Category: engineering, study, work, personal, admin, health, other.
4. Priority: urgent, high, medium, low.
5. Return JSON ONLY matching schema:
{
  "summary": "1-2 sentence overview",
  "tasks": [
    {
      "id": "t1",
      "title": "Clean imperative title",
      "description": "Details",
      "category": "engineering",
      "priority": "high",
      "estimatedMinutes": 45,
      "dueDate": "Friday",
      "ambiguityNotice": "No specific hour specified"
    }
  ],
  "clarificationsNeeded": []
}

Notes:
${text}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(this.cleanJson(response.text || '{}'));
    return {
      summary: parsed.summary || 'Tasks extracted successfully.',
      tasks: (parsed.tasks || []).map((t: any, index: number) => ({
        id: t.id || `task-gem-${Date.now()}-${index}`,
        title: t.title || 'Untitled Task',
        description: t.description || '',
        category: t.category || 'work',
        priority: t.priority || 'medium',
        estimatedMinutes: Number(t.estimatedMinutes) || 30,
        dueDate: t.dueDate || undefined,
        ambiguityNotice: t.ambiguityNotice || undefined,
        accepted: true,
      })),
      clarificationsNeeded: parsed.clarificationsNeeded || [],
      meta: {
        provider: 'gemini',
        model,
        executionMs: Date.now() - start,
        isSimulated: false,
      },
    };
  }

  async summarize(
    text: string,
    mode: SummaryMode,
    fileName?: string,
    customModel?: string
  ): Promise<SummarizeResponse> {
    const ai = this.getClient();
    const model = customModel || this.defaultModel;
    const start = Date.now();

    const response = await ai.models.generateContent({
      model,
      contents: `You are LazyFlow AI. Summarize this content in mode: ${mode}.
Modes:
- quick: 1-2 punchy sentences.
- detailed: full breakdown.
- key_points: bullet list.
- action_items: checklist.
- simple: explain like I'm 5.
Return JSON ONLY:
{
  "headline": "Headline",
  "summary": "Main summary",
  "keyPoints": ["bullet 1"],
  "actionItems": ["action 1"],
  "readingTimeMinutes": 2
}

Document: ${fileName || 'Pasted Content'}
${text}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(this.cleanJson(response.text || '{}'));
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    return {
      mode,
      headline: parsed.headline || 'Summary',
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
      readingTimeMinutes: parsed.readingTimeMinutes || Math.max(1, Math.round(wordCount / 200)),
      wordCount,
      meta: {
        provider: 'gemini',
        model,
        executionMs: Date.now() - start,
        isSimulated: false,
      },
    };
  }

  async planDay(
    tasks: TaskInput[],
    availableHours: number,
    energyLevel: EnergyLevel,
    startHour: string,
    workStyle: string,
    customModel?: string
  ): Promise<DailyPlanResponse> {
    const ai = this.getClient();
    const model = customModel || this.defaultModel;
    const start = Date.now();

    const response = await ai.models.generateContent({
      model,
      contents: `You are LazyFlow AI. Generate a mindful daily schedule based on 'Slow and Steady'.
Energy: ${energyLevel}, Available: ${availableHours}h, Start: ${startHour}, Style: ${workStyle}.
Include regular recovery breaks.
Return JSON ONLY:
{
  "scheduleOverview": "Overview",
  "pacingRationale": "Why this pacing was chosen",
  "blocks": [
    {
      "id": "b1",
      "startTime": "09:00",
      "endTime": "09:45",
      "type": "work",
      "title": "Title",
      "description": "Details",
      "durationMinutes": 45,
      "energyRequired": "high",
      "pacingReason": "Reason"
    }
  ],
  "lowEnergyAlternative": {
    "summary": "Alternative for low energy",
    "blocksToDefer": [],
    "tips": []
  }
}

Tasks:
${JSON.stringify(tasks, null, 2)}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(this.cleanJson(response.text || '{}'));

    return {
      targetHours: availableHours,
      energyLevel,
      scheduleOverview: parsed.scheduleOverview || 'Mindful daily plan',
      pacingRationale: parsed.pacingRationale || 'Sustainable pace with restorative pauses',
      blocks: parsed.blocks || [],
      lowEnergyAlternative: parsed.lowEnergyAlternative || {
        summary: 'Gentle mode',
        blocksToDefer: [],
        tips: [],
      },
      meta: {
        provider: 'gemini',
        model,
        executionMs: Date.now() - start,
        isSimulated: false,
      },
    };
  }

  async organizeFiles(
    files: FileInput[],
    contextHint?: string,
    customModel?: string
  ): Promise<FileOrganizeResponse> {
    const ai = this.getClient();
    const model = customModel || this.defaultModel;
    const start = Date.now();

    const response = await ai.models.generateContent({
      model,
      contents: `You are LazyFlow AI File Organizer. Standardize messy filenames into clean ISO 8601 names and suggest taxonomy folders.
Return JSON ONLY:
{
  "summary": "Overview",
  "suggestions": [
    {
      "originalName": "file.txt",
      "suggestedName": "2026-10-Clean-File.txt",
      "suggestedFolder": "Docs/",
      "category": "Notes",
      "reason": "Standardized",
      "confidence": 0.95
    }
  ],
  "recommendedDirectoryTree": ["Docs/"]
}

Context: ${contextHint || 'Files'}
Files:
${JSON.stringify(files, null, 2)}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(this.cleanJson(response.text || '{}'));

    return {
      summary: parsed.summary || 'File organization plan',
      suggestions: parsed.suggestions || [],
      recommendedDirectoryTree: parsed.recommendedDirectoryTree || [],
      meta: {
        provider: 'gemini',
        model,
        executionMs: Date.now() - start,
        isSimulated: false,
      },
    };
  }
}
