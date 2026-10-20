import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  Check,
  Trash2,
  Edit2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';
import { Task, TaskCategory, Priority, AppSettings } from '../../types/index.js';
import { ExtractedTask } from '../../../server/types.js';

interface QuickCaptureViewProps {
  settings: AppSettings;
  onSaveTasks: (newTasks: Task[]) => void;
  onLogActivity: (
    action: 'quick_capture',
    title: string,
    snippet: string,
    provider: string,
    model: string,
    ms: number,
    isSimulated: boolean,
    status: 'success' | 'error',
    err?: string
  ) => void;
}

export const QuickCaptureView: React.FC<QuickCaptureViewProps> = ({
  settings,
  onSaveTasks,
  onLogActivity,
}) => {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState(
    'finish dbms assignment by friday, prepare for viva, email the team about meeting, submit project report tomorrow'
  );
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [aiMeta, setAiMeta] = useState<{
    provider: string;
    model: string;
    executionMs: number;
    isSimulated: boolean;
  } | null>(null);

  // Preset demo prompts
  const samplePrompts = [
    {
      label: 'Student Rush',
      text: 'finish dbms assignment by friday, prepare for viva, email the team about meeting, submit project report tomorrow',
    },
    {
      label: 'Hacktoberfest Sprint',
      text: 'fix ollama connection timeout bug, write tests for task extraction schema, update README with offline instructions, publish demo video on dev.to by saturday',
    },
    {
      label: 'Chaotic Workday',
      text: 'schedule 1on1 with Sarah at 2pm, buy new keyboard, follow up on client invoice #402, review pull request 88, workout tonight',
    },
  ];

  const handleCapture = async () => {
    if (!inputText.trim()) {
      showToast('Please enter some notes to parse', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.quickCapture({
        text: inputText,
        provider: settings.preferredProvider,
        model: settings.preferredProvider === 'ollama' ? settings.ollamaModel : undefined,
      });

      setSummary(res.summary);
      setTasks(res.tasks.map((t) => ({ ...t, accepted: true })));
      setClarifications(res.clarificationsNeeded || []);
      setAiMeta(res.meta);

      onLogActivity(
        'quick_capture',
        `Extracted ${res.tasks.length} tasks`,
        inputText.slice(0, 60) + '...',
        res.meta.provider,
        res.meta.model,
        res.meta.executionMs,
        res.meta.isSimulated,
        'success'
      );

      showToast(`Extracted ${res.tasks.length} tasks!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Quick capture failed', 'error');
      onLogActivity(
        'quick_capture',
        'Capture Failed',
        inputText.slice(0, 60),
        settings.preferredProvider,
        settings.ollamaModel,
        0,
        settings.preferredProvider === 'simulated',
        'error',
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccept = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, accepted: !t.accepted } : t))
    );
  };

  const handleUpdateTask = (id: string, updates: Partial<ExtractedTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDiscardTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveToTasks = () => {
    const acceptedList = tasks.filter((t) => t.accepted);
    if (acceptedList.length === 0) {
      showToast('No tasks selected to save', 'error');
      return;
    }

    const converted: Task[] = acceptedList.map((t) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: t.title,
      description: t.description || `Extracted from quick capture`,
      category: t.category,
      priority: t.priority,
      status: 'todo',
      estimatedMinutes: t.estimatedMinutes || 30,
      dueDate: t.dueDate,
      createdAt: new Date().toISOString(),
      ambiguityNotice: t.ambiguityNotice,
      sourceNote: inputText,
    }));

    onSaveTasks(converted);
    showToast(`Saved ${converted.length} tasks to your Task Extractor!`, 'success');
    // Clear extracted tasks
    setTasks([]);
    setSummary(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          <span>Brain Dump to Actionable Items</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Quick Capture
        </h2>
        <p className="text-sm text-slate-300">
          Paste your stream of consciousness, messy emails, or study reminders. Our Gemma-powered extractor classifies tasks, detects explicit deadlines, and flags ambiguities.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Try example:</span>
          {samplePrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => setInputText(p.text)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#14231b] hover:bg-[#1c3327] text-slate-300 hover:text-lime-300 border border-[#213a2d] transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setInputText('')}
            className="text-xs px-2 py-1 text-slate-500 hover:text-slate-300 transition-colors ml-auto cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder="e.g. finish dbms assignment by friday, prepare for viva, email team about meeting..."
            className="w-full bg-[#080f0b] border border-[#203629] focus:border-lime-500 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-lime-500 transition-all font-sans leading-relaxed resize-y"
          />
        </div>

        {/* Action Button & Disclaimer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span>Open-weight Gemma parser respects explicit text and avoids hallucinating dates.</span>
          </div>

          <button
            onClick={handleCapture}
            disabled={loading || !inputText.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed glow-lime shrink-0"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Extracting with AI...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Structure Brain Dump</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {tasks.length > 0 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Summary & Clarifications */}
          <div className="p-4 bg-[#0e1a14] border border-emerald-800/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">
                AI Synthesis
              </span>
              <p className="text-xs text-slate-200 mt-0.5">{summary}</p>
            </div>

            {aiMeta && (
              <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                <span className="text-emerald-400 font-semibold">{aiMeta.model}</span>
                <span className="mx-1.5">•</span>
                <span>{aiMeta.executionMs}ms</span>
                {aiMeta.isSimulated && (
                  <span className="ml-1.5 text-amber-400 text-[10px]">(Simulated)</span>
                )}
              </div>
            )}
          </div>

          {/* Ambiguity Notices / Clarifications */}
          {clarifications.length > 0 && (
            <div className="p-4 bg-amber-950/20 border border-amber-600/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Ambiguities Flagged by AI (Clarification Needed):</span>
              </div>
              <ul className="text-xs text-amber-200/90 space-y-1 list-disc list-inside">
                {clarifications.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Task Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Extracted Tasks ({tasks.length}) — Click fields to edit
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, accepted: true })))}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={handleSaveToTasks}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Accepted to Task Extractor</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    task.accepted
                      ? 'bg-[#0f1d16] border-[#22402e] shadow-sm'
                      : 'bg-[#0a110d] border-[#18281f] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => handleToggleAccept(task.id)}
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors cursor-pointer mt-0.5 shrink-0 ${
                        task.accepted
                          ? 'bg-lime-500 text-slate-950 font-bold'
                          : 'border border-slate-600 hover:border-slate-400'
                      }`}
                      title={task.accepted ? 'Accepted' : 'Click to accept'}
                    >
                      {task.accepted && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex-1 space-y-2">
                      {/* Title input */}
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                        className="w-full bg-transparent font-semibold text-sm text-white focus:outline-none focus:border-b focus:border-lime-400 pb-0.5"
                      />

                      {/* Description input */}
                      <textarea
                        value={task.description || ''}
                        onChange={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                        placeholder="Add subtasks or notes..."
                        rows={2}
                        className="w-full bg-black/20 rounded-lg p-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-lime-500/50 resize-none"
                      />

                      {/* Meta selectors: Category, Priority, Deadline */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Category */}
                        <select
                          value={task.category}
                          onChange={(e) =>
                            handleUpdateTask(task.id, { category: e.target.value as TaskCategory })
                          }
                          className="bg-[#14261c] border border-[#274734] text-slate-300 rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none"
                        >
                          <option value="engineering">Engineering</option>
                          <option value="study">Study</option>
                          <option value="work">Work</option>
                          <option value="personal">Personal</option>
                          <option value="admin">Admin</option>
                          <option value="health">Health</option>
                          <option value="other">Other</option>
                        </select>

                        {/* Priority */}
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            handleUpdateTask(task.id, { priority: e.target.value as Priority })
                          }
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase border focus:outline-none ${
                            task.priority === 'urgent'
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                              : task.priority === 'high'
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                              : 'bg-[#14261c] border-[#274734] text-slate-300'
                          }`}
                        >
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>

                        {/* Due Date */}
                        <input
                          type="text"
                          value={task.dueDate || ''}
                          onChange={(e) => handleUpdateTask(task.id, { dueDate: e.target.value })}
                          placeholder="No deadline"
                          className="bg-[#14261c] border border-[#274734] text-amber-300 placeholder-slate-500 rounded-lg px-2 py-1 text-[11px] font-mono w-28 focus:outline-none"
                        />
                      </div>

                      {/* Ambiguity notice */}
                      {task.ambiguityNotice && (
                        <p className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 shrink-0" />
                          <span>{task.ambiguityNotice}</span>
                        </p>
                      )}
                    </div>

                    {/* Discard button */}
                    <button
                      onClick={() => handleDiscardTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Discard task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
