import { z } from 'zod';

export const QuickCaptureRequestSchema = z.object({
  text: z.string().min(3, 'Please enter at least 3 characters').max(20000, 'Input exceeds maximum length of 20,000 characters'),
  provider: z.enum(['ollama', 'gemini', 'simulated']).optional(),
  model: z.string().optional(),
});

export const SummarizeRequestSchema = z.object({
  text: z.string().min(5, 'Text to summarize must be at least 5 characters').max(50000, 'Content exceeds 50,000 characters limit'),
  mode: z.enum(['quick', 'detailed', 'key_points', 'action_items', 'simple']).default('detailed'),
  fileName: z.string().optional(),
  provider: z.enum(['ollama', 'gemini', 'simulated']).optional(),
  model: z.string().optional(),
});

export const ExtractTasksRequestSchema = z.object({
  notes: z.string().min(5, 'Notes must be at least 5 characters').max(25000, 'Notes exceed 25,000 characters limit'),
  defaultCategory: z.enum(['engineering', 'study', 'work', 'personal', 'admin', 'health', 'other']).optional(),
  provider: z.enum(['ollama', 'gemini', 'simulated']).optional(),
  model: z.string().optional(),
});

export const PlanDayRequestSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']),
    estimatedMinutes: z.number().min(5).max(480).optional(),
    dueDate: z.string().optional(),
  })).min(1, 'Please provide at least 1 task to schedule'),
  availableHours: z.number().min(1).max(16).default(6),
  energyLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  startHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').default('09:00'),
  workStyle: z.enum(['pomodoro', 'flow', 'balanced']).default('balanced'),
  provider: z.enum(['ollama', 'gemini', 'simulated']).optional(),
  model: z.string().optional(),
});

export const OrganizeFilesRequestSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1),
    size: z.number().optional(),
    type: z.string().optional(),
    previewSnippet: z.string().max(2000).optional(),
  })).min(1, 'Please provide at least 1 file to organize').max(50, 'Max 50 files per batch'),
  contextHint: z.string().max(500).optional(),
  provider: z.enum(['ollama', 'gemini', 'simulated']).optional(),
  model: z.string().optional(),
});

export const TestConnectionRequestSchema = z.object({
  ollamaBaseUrl: z.string().url().default('http://127.0.0.1:11434'),
  model: z.string().default('gemma2:2b'),
});
