import { AiProvider, TaskInput, FileInput } from './provider.js';
import { OllamaProvider } from './ollama.js';
import { SimulatedProvider } from './simulated.js';
import { GeminiProvider } from './gemini.js';
import {
  QuickCaptureResponse,
  SummarizeResponse,
  DailyPlanResponse,
  FileOrganizeResponse,
  AiStatusResponse,
  SummaryMode,
  EnergyLevel
} from '../types.js';

export class AiService {
  private ollama: OllamaProvider;
  private simulated: SimulatedProvider;
  private gemini: GeminiProvider;

  constructor() {
    this.ollama = new OllamaProvider();
    this.simulated = new SimulatedProvider();
    this.gemini = new GeminiProvider();
  }

  private getProvider(requestedProvider?: 'ollama' | 'gemini' | 'simulated'): AiProvider {
    if (requestedProvider === 'ollama') return this.ollama;
    if (requestedProvider === 'gemini') return this.gemini;
    if (requestedProvider === 'simulated') return this.simulated;

    // Default to Ollama if configured or simulated as safe fallback
    return this.ollama;
  }

  async getStatus(customOllamaUrl?: string, customModel?: string): Promise<AiStatusResponse> {
    const ollamaStatus = await this.ollama.checkHealth(customOllamaUrl, customModel);

    const hasGemini = Boolean(process.env.GEMINI_API_KEY);

    let activeProvider: 'ollama' | 'gemini' | 'simulated' = 'simulated';
    if (ollamaStatus.connected) {
      activeProvider = 'ollama';
    } else if (hasGemini) {
      // Default to simulated demo for open-source purity unless user switches
      activeProvider = 'simulated';
    }

    return {
      connected: ollamaStatus.connected,
      provider: activeProvider,
      model: ollamaStatus.model,
      ollamaBaseUrl: customOllamaUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      availableModels: ollamaStatus.availableModels,
      latencyMs: ollamaStatus.latencyMs,
      error: ollamaStatus.error,
      instructions: {
        runCommand: `ollama run ${ollamaStatus.model || 'gemma2:2b'}`,
        pullCommand: `ollama pull ${ollamaStatus.model || 'gemma2:2b'}`,
        offlineCapable: true,
      },
    };
  }

  async quickCapture(
    text: string,
    requestedProvider?: 'ollama' | 'gemini' | 'simulated',
    model?: string
  ): Promise<QuickCaptureResponse> {
    const provider = this.getProvider(requestedProvider);
    try {
      return await provider.quickCapture(text, model);
    } catch (err: any) {
      // If user requested Ollama but it failed, provide a graceful fallback to simulated demo mode with clear explanation
      if (provider.name === 'ollama' && (!requestedProvider || requestedProvider === 'ollama')) {
        console.warn(`[LazyFlow AI] Ollama call failed (${err.message}). Falling back to simulated local Gemma mode.`);
        const fallbackRes = await this.simulated.quickCapture(text, model);
        fallbackRes.meta.provider = 'simulated (Ollama unreachable fallback)';
        return fallbackRes;
      }
      throw err;
    }
  }

  async summarize(
    text: string,
    mode: SummaryMode,
    fileName?: string,
    requestedProvider?: 'ollama' | 'gemini' | 'simulated',
    model?: string
  ): Promise<SummarizeResponse> {
    const provider = this.getProvider(requestedProvider);
    try {
      return await provider.summarize(text, mode, fileName, model);
    } catch (err: any) {
      if (provider.name === 'ollama') {
        console.warn(`[LazyFlow AI] Ollama summarize failed (${err.message}). Falling back to simulated local Gemma mode.`);
        const fallbackRes = await this.simulated.summarize(text, mode, fileName, model);
        fallbackRes.meta.provider = 'simulated (Ollama unreachable fallback)';
        return fallbackRes;
      }
      throw err;
    }
  }

  async planDay(
    tasks: TaskInput[],
    availableHours: number,
    energyLevel: EnergyLevel,
    startHour: string,
    workStyle: string,
    requestedProvider?: 'ollama' | 'gemini' | 'simulated',
    model?: string
  ): Promise<DailyPlanResponse> {
    const provider = this.getProvider(requestedProvider);
    try {
      return await provider.planDay(tasks, availableHours, energyLevel, startHour, workStyle, model);
    } catch (err: any) {
      if (provider.name === 'ollama') {
        console.warn(`[LazyFlow AI] Ollama planDay failed (${err.message}). Falling back to simulated local Gemma mode.`);
        const fallbackRes = await this.simulated.planDay(tasks, availableHours, energyLevel, startHour, workStyle, model);
        fallbackRes.meta.provider = 'simulated (Ollama unreachable fallback)';
        return fallbackRes;
      }
      throw err;
    }
  }

  async organizeFiles(
    files: FileInput[],
    contextHint?: string,
    requestedProvider?: 'ollama' | 'gemini' | 'simulated',
    model?: string
  ): Promise<FileOrganizeResponse> {
    const provider = this.getProvider(requestedProvider);
    try {
      return await provider.organizeFiles(files, contextHint, model);
    } catch (err: any) {
      if (provider.name === 'ollama') {
        console.warn(`[LazyFlow AI] Ollama organizeFiles failed (${err.message}). Falling back to simulated local Gemma mode.`);
        const fallbackRes = await this.simulated.organizeFiles(files, contextHint, model);
        fallbackRes.meta.provider = 'simulated (Ollama unreachable fallback)';
        return fallbackRes;
      }
      throw err;
    }
  }
}

export const aiService = new AiService();
