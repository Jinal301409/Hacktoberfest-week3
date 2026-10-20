import { AiProvider, ProviderStatus, TaskInput, FileInput } from './provider.js';
import {
  QuickCaptureResponse,
  SummarizeResponse,
  DailyPlanResponse,
  FileOrganizeResponse,
  SummaryMode,
  EnergyLevel
} from '../types.js';

export class OllamaProvider implements AiProvider {
  name = 'ollama' as const;
  displayName = 'Ollama (Local Gemma Open-Weights)';
  isLocal = true;
  isSimulated = false;

  private defaultBaseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model = process.env.OLLAMA_MODEL || 'gemma2:2b'
  ) {
    this.defaultBaseUrl = baseUrl.replace(/\/+$/, '');
    this.defaultModel = model;
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

  private async callOllama(
    prompt: string,
    systemInstruction: string,
    model?: string,
    baseUrl?: string
  ): Promise<{ text: string; durationMs: number }> {
    const url = (baseUrl || this.defaultBaseUrl).replace(/\/+$/, '');
    const targetModel = model || this.defaultModel;
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          format: 'json',
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ollama request failed with HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as { message?: { content: string }; response?: string };
      const durationMs = Date.now() - startTime;
      const content = data.message?.content || data.response || '';
      return { text: content, durationMs };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Ollama request timed out after 60s at ${url}. The local model might still be loading into GPU/RAM.`);
      }
      if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(`Cannot reach Ollama at ${url}. Ensure Ollama is running ('ollama serve' or desktop app) and try 'ollama run ${targetModel}'.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async checkHealth(customUrl?: string, customModel?: string): Promise<ProviderStatus> {
    const url = (customUrl || this.defaultBaseUrl).replace(/\/+$/, '');
    const model = customModel || this.defaultModel;
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${url}/api/tags`, {
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return {
          connected: false,
          model,
          provider: 'ollama',
          availableModels: [],
          latencyMs: null,
          error: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = (data.models || []).map(m => m.name);

      const hasModel = models.some(m => m.startsWith(model) || model.startsWith(m.split(':')[0]));

      return {
        connected: true,
        model,
        provider: 'ollama',
        availableModels: models,
        latencyMs,
        error: hasModel ? undefined : `Model '${model}' not found in local Ollama. Installed models: ${models.join(', ') || 'none'}. Run 'ollama pull ${model}' in your terminal.`,
      };
    } catch (err: any) {
      return {
        connected: false,
        model,
        provider: 'ollama',
        availableModels: [],
        latencyMs: null,
        error: `Ollama is offline at ${url}. Start it with 'ollama serve' or launch the desktop application.`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async quickCapture(text: string, customModel?: string): Promise<QuickCaptureResponse> {
    const system = `You are LazyFlow AI, an open-source productivity assistant.
Transform messy, unstructured notes into structured tasks.
Rules:
1. Extract concrete tasks.
2. If due dates are explicitly mentioned (e.g., 'friday', 'tomorrow', 'oct 24'), note them. If specific time or date is ambiguous, DO NOT invent exact hours. Flag it in 'ambiguityNotice'.
3. Assign priority: 'urgent', 'high', 'medium', or 'low'.
4. Assign category: 'engineering', 'study', 'work', 'personal', 'admin', 'health', or 'other'.
5. Estimate duration in minutes.
6. Provide a concise summary of the overall brain dump.
Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Short 1-2 sentence overview",
  "tasks": [
    {
      "id": "t1",
      "title": "Clean, imperative task title",
      "description": "Additional context or subtasks",
      "category": "engineering",
      "priority": "high",
      "estimatedMinutes": 45,
      "dueDate": "Tomorrow (ambiguous time)",
      "ambiguityNotice": "No specific submission time stated"
    }
  ],
  "clarificationsNeeded": ["Any question to resolve ambiguity"]
}`;

    const { text: resultText, durationMs } = await this.callOllama(text, system, customModel);
    const parsed = JSON.parse(this.cleanJson(resultText));

    return {
      summary: parsed.summary || 'Extracted tasks from your quick notes.',
      tasks: (parsed.tasks || []).map((t: any, index: number) => ({
        id: t.id || `task-${Date.now()}-${index}`,
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
        provider: 'ollama',
        model: customModel || this.defaultModel,
        executionMs: durationMs,
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
    const system = `You are LazyFlow AI. Summarize the provided document or text.
Summary mode requested: ${mode}.
Modes meaning:
- 'quick': 1-2 concise, high-impact sentences.
- 'detailed': Comprehensive breakdown with key insights and context.
- 'key_points': Core bullet points and takeaways.
- 'action_items': Direct, actionable next steps checklist.
- 'simple': Explain like I'm 5, no jargon, intuitive analogies.
Respond ONLY with a valid JSON object matching this schema:
{
  "headline": "Punchy 3-8 word headline",
  "summary": "Main summary text (can contain markdown formatting)",
  "keyPoints": ["Bullet 1", "Bullet 2"],
  "actionItems": ["Action 1", "Action 2"],
  "readingTimeMinutes": 2
}`;

    const prompt = `Document Name: ${fileName || 'Pasted Notes'}\n\nContent:\n${text}`;
    const { text: resultText, durationMs } = await this.callOllama(prompt, system, customModel);
    const parsed = JSON.parse(this.cleanJson(resultText));

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    return {
      mode,
      headline: parsed.headline || 'Document Summary',
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
      readingTimeMinutes: parsed.readingTimeMinutes || Math.max(1, Math.round(wordCount / 200)),
      wordCount,
      meta: {
        provider: 'ollama',
        model: customModel || this.defaultModel,
        executionMs: durationMs,
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
    const system = `You are LazyFlow AI Daily Planner. Create a mindful, realistic day plan based on the 'Slow and Steady' philosophy.
Never overload the user or encourage toxic crunch. Incorporate cognitive load balancing, reasonable breaks (at least 10-15 mins between heavy blocks), and realistic buffer times.
Inputs:
- Energy level: ${energyLevel}
- Available hours: ${availableHours}h
- Start time: ${startHour}
- Work style: ${workStyle}
Respond ONLY with a valid JSON object matching this schema:
{
  "scheduleOverview": "Overview of how the day will flow",
  "pacingRationale": "Why this specific order and pacing was chosen",
  "blocks": [
    {
      "id": "b1",
      "startTime": "09:00",
      "endTime": "09:45",
      "type": "work",
      "title": "Task or Session title",
      "description": "What to focus on",
      "durationMinutes": 45,
      "taskId": "optional-id",
      "energyRequired": "high",
      "pacingReason": "Tackle high-cognition tasks early while willpower is peak"
    },
    {
      "id": "b2",
      "startTime": "09:45",
      "endTime": "10:00",
      "type": "break",
      "title": "Hydration & Eye Rest Break",
      "description": "Step away from screen, hydrate, breathe",
      "durationMinutes": 15,
      "energyRequired": "low",
      "pacingReason": "Allow dopamine and focus to reset"
    }
  ],
  "lowEnergyAlternative": {
    "summary": "If feeling exhausted or fatigued, switch to this gentle plan",
    "blocksToDefer": ["Task title 1 to postpone"],
    "tips": ["Mindful tip 1", "Mindful tip 2"]
  }
}`;

    const prompt = `Tasks to schedule:\n${JSON.stringify(tasks, null, 2)}`;
    const { text: resultText, durationMs } = await this.callOllama(prompt, system, customModel);
    const parsed = JSON.parse(this.cleanJson(resultText));

    return {
      targetHours: availableHours,
      energyLevel,
      scheduleOverview: parsed.scheduleOverview || 'Customized daily rhythm plan.',
      pacingRationale: parsed.pacingRationale || 'Balanced energy expenditure with protective recovery breaks.',
      blocks: (parsed.blocks || []).map((b: any, index: number) => ({
        id: b.id || `block-${index}`,
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '09:45',
        type: b.type === 'break' ? 'break' : b.type === 'review' ? 'review' : 'work',
        title: b.title || 'Work Session',
        description: b.description || '',
        durationMinutes: Number(b.durationMinutes) || 30,
        taskId: b.taskId || undefined,
        energyRequired: b.energyRequired || 'medium',
        pacingReason: b.pacingReason || '',
      })),
      lowEnergyAlternative: parsed.lowEnergyAlternative || {
        summary: 'Gentle mode: defer non-urgent items and keep sessions under 25 minutes.',
        blocksToDefer: [],
        tips: ['Take longer breaks', 'Focus only on 1 critical item'],
      },
      meta: {
        provider: 'ollama',
        model: customModel || this.defaultModel,
        executionMs: durationMs,
        isSimulated: false,
      },
    };
  }

  async organizeFiles(
    files: FileInput[],
    contextHint?: string,
    customModel?: string
  ): Promise<FileOrganizeResponse> {
    const system = `You are LazyFlow AI File Organizer.
Analyze messy filenames and text content to suggest clean, standardized filenames (e.g. ISO 8601 date YYYY-MM-DD, kebab-case or TitleCase), sensible directory categories, and explanations.
Do not hallucinate extensions. Maintain the original file extension unless obviously corrupted.
Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Clean file organization plan overview",
  "suggestions": [
    {
      "originalName": "IMG_202409_final_v2.png",
      "suggestedName": "2024-09-Product-Design-Final.png",
      "suggestedFolder": "Design/Assets",
      "category": "Design",
      "reason": "Normalized to ISO date and descriptive topic",
      "confidence": 0.95
    }
  ],
  "recommendedDirectoryTree": [
    "Design/Assets/",
    "Documents/Finances/",
    "Projects/Academics/"
  ]
}`;

    const prompt = `Context: ${contextHint || 'General personal and work files'}\n\nFiles:\n${JSON.stringify(files, null, 2)}`;
    const { text: resultText, durationMs } = await this.callOllama(prompt, system, customModel);
    const parsed = JSON.parse(this.cleanJson(resultText));

    return {
      summary: parsed.summary || 'Standardized naming conventions and folder taxonomy.',
      suggestions: parsed.suggestions || [],
      recommendedDirectoryTree: parsed.recommendedDirectoryTree || [],
      meta: {
        provider: 'ollama',
        model: customModel || this.defaultModel,
        executionMs: durationMs,
        isSimulated: false,
      },
    };
  }
}
