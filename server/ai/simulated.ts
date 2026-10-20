import { AiProvider, ProviderStatus, TaskInput, FileInput } from './provider.js';
import {
  QuickCaptureResponse,
  SummarizeResponse,
  DailyPlanResponse,
  FileOrganizeResponse,
  SummaryMode,
  EnergyLevel,
  ExtractedTask,
  TaskCategory,
  Priority
} from '../types.js';

export class SimulatedProvider implements AiProvider {
  name = 'simulated' as const;
  displayName = 'Simulated Gemma 2:2b (Local Demo Mode)';
  isLocal = true;
  isSimulated = true;

  private async simulateLatency(minMs = 350, maxMs = 700): Promise<number> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
  }

  async checkHealth(_customUrl?: string, customModel?: string): Promise<ProviderStatus> {
    const delay = await this.simulateLatency(50, 150);
    return {
      connected: true,
      model: customModel || 'gemma2:2b (Simulated)',
      provider: 'simulated',
      availableModels: ['gemma2:2b (Simulated)', 'gemma2:9b (Simulated)', 'gemma:7b (Simulated)'],
      latencyMs: delay,
    };
  }

  async quickCapture(text: string, customModel?: string): Promise<QuickCaptureResponse> {
    const delay = await this.simulateLatency(450, 850);

    // Smart heuristic parsing of text lines / commas / sentences
    const segments = text
      .split(/[\n,;]+|\band\b/i)
      .map(s => s.trim())
      .filter(s => s.length > 2);

    const tasks: ExtractedTask[] = [];
    const clarifications: string[] = [];

    const categoryKeywords: Record<TaskCategory, RegExp> = {
      engineering: /code|bug|repo|git|dbms|database|api|backend|frontend|server|docker|deploy|sql/i,
      study: /exam|viva|study|assignment|homework|lecture|syllabus|chapter|quiz|read/i,
      work: /client|meeting|team|email|report|presentation|deck|sync|standup|proposal/i,
      personal: /groceries|gym|workout|call|mom|dad|buy|repair|clean|laundry/i,
      admin: /invoice|tax|form|renew|passport|license|bill|pay|bank|submit/i,
      health: /doctor|dentist|medicine|meditation|sleep|walk|hydration/i,
      other: /.+/
    };

    const priorityKeywords: Record<Priority, RegExp> = {
      urgent: /urgent|asap|today|immediately|critical|emergency/i,
      high: /tomorrow|friday|important|submit|deadline|viva|exam/i,
      medium: /review|email|prepare|update|next week/i,
      low: /maybe|someday|eventually|read later|look into/i,
    };

    const datePatterns = [
      { regex: /\b(by|before|on)?\s*(friday)\b/i, label: 'This Friday', ambiguous: false },
      { regex: /\b(tomorrow)\b/i, label: 'Tomorrow', ambiguous: true },
      { regex: /\b(today|tonight)\b/i, label: 'Today (EOD)', ambiguous: true },
      { regex: /\b(next week|monday)\b/i, label: 'Next Monday', ambiguous: true },
    ];

    segments.forEach((seg, i) => {
      // Determine category
      let category: TaskCategory = 'other';
      for (const [cat, regex] of Object.entries(categoryKeywords)) {
        if (regex.test(seg)) {
          category = cat as TaskCategory;
          break;
        }
      }

      // Determine priority
      let priority: Priority = 'medium';
      for (const [prio, regex] of Object.entries(priorityKeywords)) {
        if (regex.test(seg)) {
          priority = prio as Priority;
          break;
        }
      }

      // Check date
      let dueDate: string | undefined;
      let ambiguityNotice: string | undefined;

      for (const dp of datePatterns) {
        if (dp.regex.test(seg)) {
          dueDate = dp.label;
          if (dp.ambiguous) {
            ambiguityNotice = `Exact submission hour not specified for '${dueDate}'. Defaulting to end-of-day.`;
            clarifications.push(`What specific time is '${seg.slice(0, 30)}...' due on ${dueDate}?`);
          }
          break;
        }
      }

      // Clean title
      const cleanTitle = seg
        .replace(/\b(finish|prepare for|email the|submit|complete|do)\b/i, (m) => m.charAt(0).toUpperCase() + m.slice(1))
        .replace(/\bby\s+(friday|tomorrow|today|next week)\b/i, '')
        .trim();

      tasks.push({
        id: `task-sim-${Date.now()}-${i}`,
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) || seg,
        description: `Parsed from quick notes: "${seg}"`,
        category,
        priority,
        estimatedMinutes: priority === 'urgent' || priority === 'high' ? 45 : 30,
        dueDate,
        ambiguityNotice,
        accepted: true,
      });
    });

    if (tasks.length === 0) {
      tasks.push({
        id: `task-sim-${Date.now()}-0`,
        title: text.slice(0, 50),
        description: text,
        category: 'work',
        priority: 'medium',
        estimatedMinutes: 30,
        accepted: true,
      });
    }

    return {
      summary: `Parsed ${tasks.length} actionable items from your notes. Classified priorities and flagged ambiguous time frames.`,
      tasks,
      clarificationsNeeded: Array.from(new Set(clarifications)).slice(0, 3),
      meta: {
        provider: 'simulated',
        model: customModel || 'gemma2:2b (Simulated Demo)',
        executionMs: delay,
        isSimulated: true,
      },
    };
  }

  async summarize(
    text: string,
    mode: SummaryMode,
    fileName?: string,
    customModel?: string
  ): Promise<SummarizeResponse> {
    const delay = await this.simulateLatency(500, 950);
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 10);

    let headline = 'Executive Summary';
    let summary = '';
    let keyPoints: string[] = [];
    let actionItems: string[] = [];

    switch (mode) {
      case 'quick':
        headline = 'Snapshot Summary';
        summary = sentences.slice(0, 2).join(' ') || text.slice(0, 180) + '...';
        keyPoints = [
          'Core insight: ' + (sentences[0] || 'Important operational takeaways.'),
          'Immediate implication: Focus on streamlined execution and reducing friction.'
        ];
        break;

      case 'key_points':
        headline = 'Key Architectural & Strategic Takeaways';
        summary = 'Essential high-impact takeaways extracted from the document:';
        keyPoints = (sentences.length > 3 ? sentences.slice(0, 5) : [
          'Modular, decoupled workflow design ensures local sovereignty.',
          'Open-source AI execution keeps sensitive data on premise.',
          'Iterative, step-by-step processing prevents cognitive overload.',
          'Built-in validation verifies structured outputs before downstream tasks.'
        ]).map(s => s.replace(/^[•\-\*]\s*/, '').trim());
        break;

      case 'action_items':
        headline = 'Actionable Implementation Checklist';
        summary = 'Concrete steps extracted from the document to drive next actions:';
        actionItems = [
          'Review extracted tasks and confirm priorities for today.',
          'Set up local Ollama environment with Gemma 2 open-weight model.',
          'Allocate a 45-minute focus window to tackle the most critical deliverable.',
          'Archive or organize referenced source documents into designated folders.'
        ];
        break;

      case 'simple':
        headline = 'Simple Plain-English Breakdown';
        summary = `Here is the big idea without any confusing jargon: Think of this like cleaning up a messy desk. Instead of letting all your notes and to-dos pile up in a jumbled heap, LazyFlow AI acts like a friendly organizer that picks up each sticky note, figures out what really matters right now, and lays it out in a calm, step-by-step order so you don't feel overwhelmed.`;
        keyPoints = [
          'No tech jargon: Focus on one thing at a time.',
          'Saves mental energy: You don’t have to keep everything in your head.',
          'Stay private: Your thoughts stay right here on your computer.'
        ];
        break;

      case 'detailed':
      default:
        headline = fileName ? `In-depth Overview: ${fileName}` : 'Comprehensive Document Synthesis';
        summary = `The provided document covers key operational elements and structured workflow procedures. ` +
          (sentences.length > 0 ? sentences.slice(0, 3).join(' ') : text.slice(0, 280)) +
          `\n\nOverall, the material emphasizes a steady, privacy-first methodology that minimizes context switching while preserving transparency and control.`;
        keyPoints = [
          'Clear delineation between high-effort tasks and low-friction administrative routines.',
          'Incorporation of deliberate rest periods to prevent afternoon fatigue.',
          'Structured verification to catch ambiguities early rather than guessing.'
        ];
        actionItems = [
          'Confirm team alignment on timeline and deliverables.',
          'Integrate structured task list into today’s Lazy Mode plan.'
        ];
        break;
    }

    return {
      mode,
      headline,
      summary,
      keyPoints,
      actionItems,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
      wordCount,
      meta: {
        provider: 'simulated',
        model: customModel || 'gemma2:2b (Simulated Demo)',
        executionMs: delay,
        isSimulated: true,
      },
    };
  }

  async planDay(
    tasks: TaskInput[],
    availableHours: number,
    energyLevel: EnergyLevel,
    startHour: string,
    _workStyle: string,
    customModel?: string
  ): Promise<DailyPlanResponse> {
    const delay = await this.simulateLatency(550, 950);

    // Sort tasks: urgent first, then high, then medium, then low
    const prioWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    const sortedTasks = [...tasks].sort((a, b) => (prioWeight[b.priority] || 0) - (prioWeight[a.priority] || 0));

    const [startH, startM] = startHour.split(':').map(Number);
    let currentMinute = startH * 60 + startM;

    const formatTime = (totalMin: number) => {
      const h = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const blocks: any[] = [];
    const maxMinutes = availableHours * 60;
    let elapsedMinutes = 0;

    // Plan sessions with deliberate breaks
    const sessionDuration = energyLevel === 'low' ? 25 : energyLevel === 'high' ? 50 : 35;
    const breakDuration = energyLevel === 'low' ? 15 : 10;

    let taskIdx = 0;
    while (elapsedMinutes < maxMinutes && taskIdx < sortedTasks.length) {
      const task = sortedTasks[taskIdx];
      const duration = Math.min(task.estimatedMinutes || sessionDuration, maxMinutes - elapsedMinutes);
      
      const startTime = formatTime(currentMinute);
      currentMinute += duration;
      const endTime = formatTime(currentMinute);
      elapsedMinutes += duration;

      blocks.push({
        id: `block-${blocks.length + 1}`,
        startTime,
        endTime,
        type: 'work',
        title: task.title,
        description: `Dedicated focus on ${task.priority.toUpperCase()} priority item: ${task.title}. Keep distraction triggers muted.`,
        durationMinutes: duration,
        taskId: task.id,
        energyRequired: task.priority === 'urgent' || task.priority === 'high' ? 'high' : 'medium',
        pacingReason: taskIdx === 0
          ? 'Front-loaded high-cognitive effort while decision fatigue is lowest.'
          : 'Structured steady progression following energy-aware cadence.',
      });

      taskIdx++;

      // Insert break if more time remaining
      if (elapsedMinutes + breakDuration < maxMinutes && taskIdx < sortedTasks.length) {
        const breakStart = formatTime(currentMinute);
        currentMinute += breakDuration;
        const breakEnd = formatTime(currentMinute);
        elapsedMinutes += breakDuration;

        blocks.push({
          id: `block-${blocks.length + 1}`,
          startTime: breakStart,
          endTime: breakEnd,
          type: 'break',
          title: 'Mindful Recovery & Hydration',
          description: 'Step away from screen, drink water, do light shoulder/neck stretches.',
          durationMinutes: breakDuration,
          energyRequired: 'low',
          pacingReason: 'Strategic disengagement prevents cognitive saturation and sustains afternoon energy.',
        });
      }
    }

    // Add a final brief wrap-up block
    if (elapsedMinutes < maxMinutes - 10) {
      const wrapDuration = Math.min(15, maxMinutes - elapsedMinutes);
      const wrapStart = formatTime(currentMinute);
      currentMinute += wrapDuration;
      const wrapEnd = formatTime(currentMinute);

      blocks.push({
        id: `block-${blocks.length + 1}`,
        startTime: wrapStart,
        endTime: wrapEnd,
        type: 'review',
        title: 'Daily Reflection & Desk Reset',
        description: 'Review accomplished tasks, log progress, and prepare clean slate for tomorrow.',
        durationMinutes: wrapDuration,
        energyRequired: 'low',
        pacingReason: 'Mental closure stops open loops from interfering with evening rest.',
      });
    }

    const deferredTasks = sortedTasks.slice(taskIdx).map(t => t.title);

    return {
      targetHours: availableHours,
      energyLevel,
      scheduleOverview: `Balanced ${availableHours}-hour rhythm scheduled for ${energyLevel} energy. Includes ${blocks.filter(b => b.type === 'work').length} focused work sprints and ${blocks.filter(b => b.type === 'break').length} deliberate recovery windows.`,
      pacingRationale: `Structured around the 'Slow and Steady' principle. Heavy cognitive loads are tackled upfront, interspersed with restorative physical micro-breaks to ensure sustainable pacing without burn-out.`,
      blocks,
      lowEnergyAlternative: {
        summary: 'If energy dips below 40%, drop complex problem solving and execute short 20-minute admin sweeps.',
        blocksToDefer: deferredTasks.length > 0 ? deferredTasks : ['Non-urgent review sessions and ad-hoc emails'],
        tips: [
          'Switch sitting to standing or take a 10-minute sunlight walk.',
          'Complete only the #1 critical task, defer remainder to tomorrow without guilt.',
          'Hydrate with electrolytes and dim bright display backlights.'
        ],
      },
      meta: {
        provider: 'simulated',
        model: customModel || 'gemma2:2b (Simulated Demo)',
        executionMs: delay,
        isSimulated: true,
      },
    };
  }

  async organizeFiles(
    files: FileInput[],
    contextHint?: string,
    customModel?: string
  ): Promise<FileOrganizeResponse> {
    const delay = await this.simulateLatency(400, 750);

    const nowYear = new Date().getFullYear();
    const nowMonth = String(new Date().getMonth() + 1).padStart(2, '0');

    const suggestions = files.map(file => {
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
      const base = file.name.slice(0, file.name.length - ext.length);

      let cleanBase = base
        .replace(/[_\-\s\(\)\d]+/g, ' ')
        .trim();

      // Categorize based on name and extension
      let folder = 'General/';
      let category = 'Documents';
      let reason = 'Standardized naming convention';

      if (/img|screenshot|photo|screen|banner|asset|svg|png|jpg/i.test(file.name) || /png|jpg|jpeg|svg|webp/i.test(ext)) {
        folder = 'Media/Images/';
        category = 'Media';
        cleanBase = cleanBase.replace(/img|screen|shot|capture/gi, '').trim() || 'Visual-Asset';
        reason = 'Standardized to ISO date and descriptive media identifier';
      } else if (/dbms|lecture|study|assignment|homework|notes|course/i.test(file.name)) {
        folder = 'Academics/Coursework/';
        category = 'Study';
        reason = 'Structured by academic domain and standardized capitalization';
      } else if (/invoice|receipt|tax|bill|statement|financial/i.test(file.name)) {
        folder = 'Finance/Receipts/';
        category = 'Finance';
        reason = 'Added fiscal period and structured vendor nomenclature';
      } else if (/code|script|api|backend|docker|config|test/i.test(file.name)) {
        folder = 'Development/Scripts/';
        category = 'Engineering';
        reason = 'Grouped in development source directory';
      } else if (/meeting|sync|transcript|agenda|minutes/i.test(file.name)) {
        folder = 'Meetings/Transcripts/';
        category = 'Work';
        reason = 'Normalized to ISO date with meeting subject identifier';
      }

      // Format clean title
      const formattedTitle = cleanBase
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('-');

      const suggestedName = `${nowYear}-${nowMonth}-${formattedTitle || 'Document'}${ext}`;

      return {
        originalName: file.name,
        suggestedName,
        suggestedFolder: folder,
        category,
        reason: `${reason} with ISO 8601 prefix (${contextHint ? 'aligned with ' + contextHint : 'cleaned up'})`,
        confidence: 0.94,
      };
    });

    const folders = Array.from(new Set(suggestions.map(s => s.suggestedFolder)));

    return {
      summary: `Analyzed ${files.length} items. Proposed standardized ISO-8601 prefixes, semantic camel/hyphen casings, and organized directory taxonomies.`,
      suggestions,
      recommendedDirectoryTree: folders,
      meta: {
        provider: 'simulated',
        model: customModel || 'gemma2:2b (Simulated Demo)',
        executionMs: delay,
        isSimulated: true,
      },
    };
  }
}
