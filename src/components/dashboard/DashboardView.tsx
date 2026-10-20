import React from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  FileText,
  CheckSquare,
  FolderGit2,
  Activity,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Task, DailyPlan, ActivityItem } from '../../types/index.js';

interface DashboardViewProps {
  tasks: Task[];
  activePlan: DailyPlan | null;
  activities: ActivityItem[];
  isSampleData: boolean;
  onNavigate: (tab: string) => void;
  onToggleTask: (taskId: string) => void;
  onClearSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  activePlan,
  activities,
  isSampleData,
  onNavigate,
  onToggleTask,
  onClearSampleData,
}) => {
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const dueTodayTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      (t.dueDate?.toLowerCase().includes('today') ||
        t.priority === 'urgent' ||
        t.dueDate?.toLowerCase().includes('tonight'))
  );

  // Time saving estimation logic:
  // ~8 minutes saved per parsed capture task, ~12 min per summary, ~15 min per daily plan
  const workflowsCount = activities.filter((a) => a.status === 'success').length;
  const estimatedMinutesSaved = Math.max(15, workflowsCount * 9 + completedTasks.length * 6);

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Sample Data Banner */}
      {isSampleData && (
        <div className="flex items-center justify-between p-3.5 bg-amber-950/30 border border-amber-600/30 rounded-2xl text-xs text-amber-200 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Sample Demo Data Active:</strong> The current tasks and workflows are realistic placeholders for Hacktoberfest evaluation.
            </span>
          </div>
          <button
            onClick={onClearSampleData}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-lg border border-amber-500/30 transition-colors cursor-pointer text-xs shrink-0"
          >
            Clear Sample Data
          </button>
        </div>
      )}

      {/* Hero Welcome & Quick Start Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1f16] via-[#09150f] to-[#060b08] border border-[#213a2c] p-6 lg:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-lime-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold tracking-wide uppercase">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayStr} • Slow & Steady Cadence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              You relax. Your AI handles the boring stuff.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Transform messy brain dumps into structured tasks, calm schedules, and clear documents using privacy-conscious Gemma 2 open-weights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('quick-capture')}
              className="px-4 py-2.5 rounded-xl bg-[#14261c] hover:bg-[#1a3325] border border-[#294a37] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-lime-400" />
              <span>Quick Brain Dump</span>
            </button>

            <button
              onClick={() => onNavigate('planner')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:shadow-lime-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer glow-lime"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Start Lazy Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due Today */}
        <div
          onClick={() => onNavigate('tasks')}
          className="glass-panel p-5 rounded-2xl hover:border-lime-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Due Today</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {dueTodayTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">tasks</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">High-focus deliverables</p>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="glass-panel p-5 rounded-2xl hover:border-lime-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Pending Tasks</span>
            <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">in queue</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for Lazy Mode planner</p>
        </div>

        {/* Completed Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="glass-panel p-5 rounded-2xl hover:border-lime-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
              {completedTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">finished</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Steady, mindful progress</p>
        </div>

        {/* Time-Saving Estimate */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Est. Time Saved</span>
            <div className="p-2 rounded-xl bg-lime-400/10 text-lime-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-lime-400">
              ~{estimatedMinutesSaved}
            </span>
            <span className="text-xs text-slate-400 font-medium">mins</span>
          </div>
          <p className="text-[10px] text-amber-300/80 mt-1 font-mono">
            *Theoretical estimate based on automated workflows
          </p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
            AI Automation Workflows
          </h3>
          <span className="text-xs text-slate-400">Click any card to launch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Capture */}
          <div
            onClick={() => onNavigate('quick-capture')}
            className="p-4 rounded-2xl bg-[#0c1611] hover:bg-[#112019] border border-[#1d3326] hover:border-lime-500/40 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-lime-500/15 text-lime-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-lime-300 transition-colors">
              Quick Capture
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Paste chaotic notes; get structured tasks, priorities, and deadlines.
            </p>
          </div>

          {/* Smart Summarizer */}
          <div
            onClick={() => onNavigate('summarizer')}
            className="p-4 rounded-2xl bg-[#0c1611] hover:bg-[#112019] border border-[#1d3326] hover:border-lime-500/40 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Smart Summarizer
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Distill long documents or notes into key insights and action items.
            </p>
          </div>

          {/* Daily Planner */}
          <div
            onClick={() => onNavigate('planner')}
            className="p-4 rounded-2xl bg-[#0c1611] hover:bg-[#112019] border border-[#1d3326] hover:border-lime-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400/20 to-emerald-400/20 text-lime-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-lime-300 transition-colors">
              Lazy Mode Planner
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Generate a realistic day plan balanced with healthy restorative breaks.
            </p>
          </div>

          {/* File Organizer */}
          <div
            onClick={() => onNavigate('organizer')}
            className="p-4 rounded-2xl bg-[#0c1611] hover:bg-[#112019] border border-[#1d3326] hover:border-lime-500/40 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
              File Organizer
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Standardize messy filenames into clean ISO dates and categories.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule / Active Plan */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-lime-400" />
                <h3 className="text-sm font-bold text-white">Today's Rhythm Schedule</h3>
              </div>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>{activePlan ? 'Adjust Plan' : 'Generate Plan'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {activePlan && activePlan.blocks.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-300 mb-3 bg-[#112017] p-2.5 rounded-xl border border-emerald-800/20">
                  {activePlan.scheduleOverview}
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {activePlan.blocks.slice(0, 5).map((block) => (
                    <div
                      key={block.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        block.type === 'break'
                          ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200'
                          : 'bg-[#101b15] border-[#22392c] text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-slate-400 w-24">
                          {block.startTime} - {block.endTime}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{block.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {block.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-white/5 border border-white/10 shrink-0">
                        {block.durationMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#0d1611] rounded-2xl border border-dashed border-[#22392c] my-auto">
                <Sparkles className="w-8 h-8 text-lime-400/60 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">No active schedule yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Click below to generate an energy-aware schedule for your pending tasks.
                </p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="mt-4 px-4 py-2 bg-[#172c20] hover:bg-[#1f3a2b] border border-emerald-600/30 text-lime-300 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Build Today's Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Priority Deliverables / Quick check */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Upcoming Tasks</h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>View all ({tasks.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingTasks.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-[#0d1611] hover:bg-[#121f18] rounded-xl border border-[#1e3427] flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Mark completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-lime-300 transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-800 text-slate-300">
                            {task.category}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-amber-300 font-mono">
                              {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#0d1611] rounded-2xl border border-dashed border-[#22392c]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">All caught up!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  No pending tasks right now. Relax, or use Quick Capture to dump new thoughts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
