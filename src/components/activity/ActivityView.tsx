import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Download,
  Trash2,
  Filter,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { ActivityItem } from '../../types/index.js';
import { useToast } from '../common/Toast.js';

interface ActivityViewProps {
  activities: ActivityItem[];
  isSampleData: boolean;
  onClearActivity: () => void;
  onNavigate: (tab: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  isSampleData,
  onClearActivity,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = activities.filter((item) => {
    if (filterAction !== 'all' && item.action !== filterAction) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activities, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `lazyflow-activity-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    showToast('Exported AI Activity log', 'success');
  };

  const getActionTab = (action: ActivityItem['action']) => {
    switch (action) {
      case 'quick_capture':
        return 'quick-capture';
      case 'summarize':
        return 'summarizer';
      case 'extract_tasks':
        return 'tasks';
      case 'plan_day':
        return 'planner';
      case 'organize_files':
        return 'organizer';
      default:
        return 'dashboard';
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Audit Trail & Transparency</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            AI Activity & Execution Log
          </h2>
          <p className="text-sm text-slate-300">
            Real performance timings, model attributions, and local execution logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-200 border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Log</span>
              </button>

              <button
                onClick={onClearActivity}
                className="px-3.5 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-800/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sample data alert */}
      {isSampleData && (
        <div className="p-3 bg-amber-950/20 border border-amber-600/30 rounded-2xl text-xs text-amber-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Note on Sample Workflows:</strong> Demo workflows are marked with (Sample). Real runs will accurately capture your machine's exact execution milliseconds.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-semibold">Filter Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-[#08100c] border border-[#1f382a] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">All Actions</option>
              <option value="quick_capture">Quick Capture</option>
              <option value="summarize">Summarizer</option>
              <option value="extract_tasks">Task Extractor</option>
              <option value="plan_day">Daily Planner</option>
              <option value="organize_files">File Organizer</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#08100c] border border-[#1f382a] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <span className="text-slate-400 font-mono">
          {filtered.length} log {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Log Entries List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.status === 'success'
                  ? 'bg-[#0a140f] border-[#1d3326] hover:border-emerald-500/30'
                  : 'bg-[#1a0f12] border-rose-900/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      item.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {item.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.2 rounded font-mono uppercase bg-[#14261c] text-slate-300 border border-[#274734]">
                        {item.action.replace('_', ' ')}
                      </span>
                      {item.isSimulated && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Demo Simulated
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-mono line-clamp-1">
                      "{item.inputSnippet}"
                    </p>

                    {item.errorMessage && (
                      <p className="text-xs text-rose-300 font-mono bg-rose-950/30 p-2 rounded-lg border border-rose-800/30">
                        Error: {item.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a2f23]">
                  <div className="text-left sm:text-right text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div className="flex items-center sm:justify-end gap-1.5 text-emerald-400 font-semibold">
                      <Cpu className="w-3 h-3" />
                      <span>{item.model}</span>
                    </div>
                    <div>
                      {item.executionMs > 0 ? (
                        <span>{item.executionMs} ms</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      <span className="mx-1">•</span>
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(getActionTab(item.action))}
                    className="p-1.5 rounded-lg bg-[#14261c] hover:bg-[#1a3325] text-slate-300 hover:text-lime-300 border border-[#274734] transition-colors cursor-pointer"
                    title="Launch feature again"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-[#09110d] rounded-3xl border border-dashed border-[#1f372a]">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No activity logged yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Run Quick Capture, summarize a document, or generate a daily plan to populate this log.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
