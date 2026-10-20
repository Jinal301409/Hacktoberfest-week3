import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  Download,
  AlertCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Task, TaskCategory, Priority, TaskStatus, AppSettings } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';

interface TaskExtractorViewProps {
  tasks: Task[];
  settings: AppSettings;
  onAddTask: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
  onLogActivity: (
    action: 'extract_tasks',
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

export const TaskExtractorView: React.FC<TaskExtractorViewProps> = ({
  tasks,
  settings,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onClearCompleted,
  onLogActivity,
}) => {
  const { showToast } = useToast();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  // Quick Inline Add / Extract
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('engineering');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDuration, setNewDuration] = useState(30);

  // Extract from raw notes box
  const [notesInput, setNotesInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  // Editing modal/state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      category: newCategory,
      priority: newPriority,
      status: 'todo',
      estimatedMinutes: newDuration,
      dueDate: newDueDate.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTask(task);
    showToast(`Task '${task.title}' added!`, 'success');
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setShowAddModal(false);
  };

  const handleExtractFromNotes = async () => {
    if (!notesInput.trim()) {
      showToast('Please enter meeting notes or text to extract', 'error');
      return;
    }

    setIsExtracting(true);
    try {
      const res = await api.quickCapture({
        text: notesInput,
        provider: settings.preferredProvider,
        model: settings.preferredProvider === 'ollama' ? settings.ollamaModel : undefined,
      });

      const extractedTasks: Task[] = res.tasks.map((t) => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: t.title,
        description: t.description || `Extracted from notes`,
        category: t.category,
        priority: t.priority,
        status: 'todo',
        estimatedMinutes: t.estimatedMinutes || 30,
        dueDate: t.dueDate,
        createdAt: new Date().toISOString(),
        ambiguityNotice: t.ambiguityNotice,
        sourceNote: notesInput,
      }));

      extractedTasks.forEach((t) => onAddTask(t));

      onLogActivity(
        'extract_tasks',
        `Extracted ${extractedTasks.length} tasks from notes`,
        notesInput.slice(0, 50),
        res.meta.provider,
        res.meta.model,
        res.meta.executionMs,
        res.meta.isSimulated,
        'success'
      );

      showToast(`Added ${extractedTasks.length} structured tasks!`, 'success');
      setNotesInput('');
      setShowNotesDrawer(false);
    } catch (err: any) {
      showToast(err.message || 'Extraction failed', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `lazyflow-tasks-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    showToast('Exported tasks to JSON', 'success');
  };

  const handleExportMarkdown = () => {
    let md = `# LazyFlow AI Tasks — ${new Date().toLocaleDateString()}\n\n`;
    tasks.forEach((t) => {
      const check = t.status === 'completed' ? '[x]' : '[ ]';
      md += `- ${check} **${t.title}** (${t.priority.toUpperCase()} | ${t.category})\n`;
      if (t.description) md += `  - Details: ${t.description}\n`;
      if (t.dueDate) md += `  - Due: ${t.dueDate}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lazyflow-tasks-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported tasks to Markdown', 'success');
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCat = task.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" />
            <span>Structured Task Matrix</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Task Extractor & Manager
          </h2>
          <p className="text-sm text-slate-300">
            Organized backlog persisted locally. Filter by status, priority, and category.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className="px-3.5 py-2 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-200 border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span>Extract from Notes</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer glow-lime shadow-sm"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Extract From Notes Drawer */}
      {showNotesDrawer && (
        <div className="p-5 bg-[#0e1b14] border border-emerald-500/30 rounded-3xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span>AI Task Extractor from Raw Notes</span>
            </h4>
            <button
              onClick={() => setShowNotesDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            rows={3}
            placeholder="Paste meeting transcript, slack sync notes, or study guidelines..."
            className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleExtractFromNotes}
              disabled={isExtracting || !notesInput.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExtracting ? 'Extracting...' : 'Extract & Add to Tasks'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, descriptions, tags..."
              className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-lime-500"
          >
            <option value="all">All Statuses ({tasks.length})</option>
            <option value="todo">To Do ({tasks.filter((t) => t.status === 'todo').length})</option>
            <option value="in_progress">
              In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
            </option>
            <option value="completed">Completed ({completedCount})</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-lime-500"
          >
            <option value="all">All Categories</option>
            <option value="engineering">Engineering</option>
            <option value="study">Study</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="admin">Admin</option>
            <option value="health">Health</option>
            <option value="other">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-lime-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Action Bar: Exports & Clear Completed */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a2f23] text-xs">
          <span className="text-slate-400">
            Showing <strong>{filteredTasks.length}</strong> of {tasks.length} tasks
          </span>

          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <button
                onClick={onClearCompleted}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Clear Completed ({completedCount})
              </button>
            )}

            <button
              onClick={handleExportJson}
              className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export MD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-2.5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all group ${
                task.status === 'completed'
                  ? 'bg-[#09110d]/60 border-[#15231a] opacity-60'
                  : task.status === 'in_progress'
                  ? 'bg-[#0e1c15] border-emerald-600/40 shadow-sm'
                  : 'bg-[#0a140f] border-[#1d3326] hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Checkmark & Content */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => {
                      const nextStatus: TaskStatus =
                        task.status === 'completed'
                          ? 'todo'
                          : task.status === 'todo'
                          ? 'in_progress'
                          : 'completed';
                      onUpdateTask(task.id, {
                        status: nextStatus,
                        completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
                      });
                    }}
                    className="mt-0.5 text-slate-400 hover:text-lime-400 transition-colors cursor-pointer shrink-0"
                    title={`Current: ${task.status}. Click to cycle status.`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : task.status === 'in_progress' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-lime-400 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-white" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold transition-all ${
                          task.status === 'completed'
                            ? 'line-through text-slate-500'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Status pill */}
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          task.status === 'completed'
                            ? 'bg-emerald-950/40 text-emerald-400'
                            : task.status === 'in_progress'
                            ? 'bg-lime-400/20 text-lime-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase bg-[#14261c] text-slate-300 border border-[#274734]">
                        {task.category}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                          task.priority === 'urgent'
                            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                            : task.priority === 'high'
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                            : task.priority === 'medium'
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </span>
                      )}

                      {task.estimatedMinutes && (
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedMinutes}m</span>
                        </span>
                      )}

                      {task.ambiguityNotice && (
                        <span
                          className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1"
                          title={task.ambiguityNotice}
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Ambiguous Time</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-[#09110d] rounded-3xl border border-dashed border-[#1f372a]">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No tasks match your filter</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or add new tasks using Quick Capture.
            </p>
          </div>
        )}
      </div>

      {/* Manual Task Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1b14] border border-[#274734] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-lime-400" />
              <span>Create Structured Task</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement Ollama health check retry mechanism"
                  className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description / Context
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Additional context, subtasks, or reference links..."
                  className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                  >
                    <option value="engineering">Engineering</option>
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="admin">Admin</option>
                    <option value="health">Health</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Est. Duration (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    step={5}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Due Date (Explicit or Human label)
                </label>
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="e.g. This Friday, 2026-10-24, Today (EOD)"
                  className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f382a]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer glow-lime"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
