import { Router, Request, Response } from 'express';
import { aiService } from './ai/service.js';
import {
  QuickCaptureRequestSchema,
  SummarizeRequestSchema,
  ExtractTasksRequestSchema,
  PlanDayRequestSchema,
  OrganizeFilesRequestSchema,
  TestConnectionRequestSchema
} from './ai/schemas.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'LazyFlow AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// AI Service Status
apiRouter.get('/ai/status', async (req: Request, res: Response) => {
  try {
    const customUrl = req.query.url as string | undefined;
    const customModel = req.query.model as string | undefined;
    const status = await aiService.getStatus(customUrl, customModel);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve AI service status',
      details: err.message,
    });
  }
});

// Test custom Ollama connection
apiRouter.post('/ai/test-connection', async (req: Request, res: Response) => {
  try {
    const parsed = TestConnectionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid connection parameters',
        issues: parsed.error.issues,
      });
    }

    const { ollamaBaseUrl, model } = parsed.data;
    const status = await aiService.getStatus(ollamaBaseUrl, model);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      error: 'Connection test failed',
      details: err.message,
    });
  }
});

// Quick Capture: parse messy unstructured notes
apiRouter.post('/ai/quick-capture', async (req: Request, res: Response) => {
  try {
    const parsed = QuickCaptureRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        issues: parsed.error.issues.map(i => i.message),
      });
    }

    const { text, provider, model } = parsed.data;
    const result = await aiService.quickCapture(text, provider, model);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/quick-capture:', err);
    res.status(500).json({
      error: 'Failed to extract tasks from quick capture input',
      details: err.message,
    });
  }
});

// Extract Tasks (alias for task extractor with optional default category)
apiRouter.post('/api/ai/extract-tasks', async (req: Request, res: Response) => {
  try {
    const parsed = ExtractTasksRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        issues: parsed.error.issues.map(i => i.message),
      });
    }

    const { notes, defaultCategory, provider, model } = parsed.data;
    const result = await aiService.quickCapture(notes, provider, model);
    
    // Apply defaultCategory if provided and task category is other
    if (defaultCategory) {
      result.tasks.forEach(t => {
        if (t.category === 'other' || !t.category) {
          t.category = defaultCategory;
        }
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/extract-tasks:', err);
    res.status(500).json({
      error: 'Task extraction failed',
      details: err.message,
    });
  }
});

// Also support POST /ai/extract-tasks (both with or without prefix)
apiRouter.post('/ai/extract-tasks', async (req: Request, res: Response) => {
  try {
    const parsed = ExtractTasksRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        issues: parsed.error.issues.map(i => i.message),
      });
    }

    const { notes, defaultCategory, provider, model } = parsed.data;
    const result = await aiService.quickCapture(notes, provider, model);
    
    if (defaultCategory) {
      result.tasks.forEach(t => {
        if (t.category === 'other' || !t.category) {
          t.category = defaultCategory;
        }
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('Error in /ai/extract-tasks:', err);
    res.status(500).json({
      error: 'Task extraction failed',
      details: err.message,
    });
  }
});

// Summarize Document / Text
apiRouter.post('/ai/summarize', async (req: Request, res: Response) => {
  try {
    const parsed = SummarizeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        issues: parsed.error.issues.map(i => i.message),
      });
    }

    const { text, mode, fileName, provider, model } = parsed.data;
    const result = await aiService.summarize(text, mode, fileName, provider, model);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/summarize:', err);
    res.status(500).json({
      error: 'Summarization failed',
      details: err.message,
    });
  }
});

// Daily Planner ("Lazy Mode")
apiRouter.post('/ai/plan-day', async (req: Request, res: Response) => {
  try {
    const parsed = PlanDayRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        issues: parsed.error.issues.map(i => i.message),
      });
    }

    const { tasks, availableHours, energyLevel, startHour, workStyle, provider, model } = parsed.data;
    const result = await aiService.planDay(tasks, availableHours, energyLevel, startHour, workStyle, provider, model);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/plan-day:', err);
    res.status(500).json({
      error: 'Daily planning failed',
      details: err.message,
    });
  }
});

// File Organizer
apiRouter.post('/ai/organize-files', async (req: Request, res: Response) => {
  try {
    const parsed = OrganizeFilesRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        issues: parsed.error.issues.map(i => i.message),
      });
    }

    const { files, contextHint, provider, model } = parsed.data;
    const result = await aiService.organizeFiles(files, contextHint, provider, model);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/organize-files:', err);
    res.status(500).json({
      error: 'File organization failed',
      details: err.message,
    });
  }
});
