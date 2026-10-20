import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Sparkles,
  Coffee,
  CheckCircle2,
  Clock,
  RotateCcw,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Heart,
  Sliders,
  Battery,
  BatteryMedium,
  BatteryCharging
} from 'lucide-react';
import { Task, DailyPlan, TimeBlock, EnergyLevel, WorkStyle, AppSettings } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';

interface DailyPlannerViewProps {
  tasks: Task[];
  activePlan: DailyPlan | null;
  settings: AppSettings;
  onSavePlan: (plan: DailyPlan | null) => void;
  onLogActivity: (
    action: 'plan_day',
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

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  tasks,
  activePlan,
  settings,
  onSavePlan,
  onLogActivity,
}) => {
  const { showToast } = useToast();

  const [availableHours, setAvailableHours] = useState<number>(settings.defaultWorkHours || 6);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(settings.defaultEnergyLevel || 'medium');
  const [workStyle, setWorkStyle] = useState<WorkStyle>(settings.defaultWorkStyle || 'balanced');
  const [startHour, setStartHour] = useState('09:00');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(activePlan);
  const [showLowEnergyDrawer, setShowLowEnergyDrawer] = useState(false);

  // Focus Timer for the Active Block
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Initialize selected tasks from pending tasks
  useEffect(() => {
    if (selectedTaskIds.length === 0 && tasks.length > 0) {
      const pending = tasks.filter((t) => t.status !== 'completed').slice(0, 5);
      setSelectedTaskIds(pending.map((t) => t.id));
    }
  }, [tasks]);

  // Keep plan in sync with prop
  useEffect(() => {
    if (activePlan) {
      setCurrentPlan(activePlan);
      if (activePlan.blocks.length > 0) {
        setTimerSecondsLeft(activePlan.blocks[0].durationMinutes * 60);
      }
    }
  }, [activePlan]);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      showToast('Session completed! Time for the next rhythm block.', 'success');
      // Advance to next block if available
      if (currentPlan && activeBlockIndex < currentPlan.blocks.length - 1) {
        const nextIdx = activeBlockIndex + 1;
        setActiveBlockIndex(nextIdx);
        setTimerSecondsLeft(currentPlan.blocks[nextIdx].durationMinutes * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSecondsLeft, activeBlockIndex, currentPlan]);

  const handleSelectBlockForTimer = (index: number) => {
    if (!currentPlan) return;
    setActiveBlockIndex(index);
    setTimerSecondsLeft(currentPlan.blocks[index].durationMinutes * 60);
    setTimerRunning(false);
  };

  const handleToggleTaskSelection = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGeneratePlan = async () => {
    const chosenTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
    if (chosenTasks.length === 0) {
      showToast('Please select at least 1 task to schedule', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.planDay({
        tasks: chosenTasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          estimatedMinutes: t.estimatedMinutes,
          dueDate: t.dueDate,
        })),
        availableHours,
        energyLevel,
        startHour,
        workStyle,
        provider: settings.preferredProvider,
        model: settings.preferredProvider === 'ollama' ? settings.ollamaModel : undefined,
      });

      const newPlan: DailyPlan = {
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        targetHours: res.targetHours,
        energyLevel: res.energyLevel,
        scheduleOverview: res.scheduleOverview,
        pacingRationale: res.pacingRationale,
        blocks: res.blocks.map((b) => ({ ...b, completed: false })),
        lowEnergyAlternative: res.lowEnergyAlternative,
        meta: res.meta,
      };

      setCurrentPlan(newPlan);
      onSavePlan(newPlan);
      setActiveBlockIndex(0);
      if (newPlan.blocks.length > 0) {
        setTimerSecondsLeft(newPlan.blocks[0].durationMinutes * 60);
      }

      onLogActivity(
        'plan_day',
        `Generated ${newPlan.targetHours}h plan (${energyLevel} energy)`,
        `${chosenTasks.length} tasks scheduled with mindful breaks`,
        res.meta.provider,
        res.meta.model,
        res.meta.executionMs,
        res.meta.isSimulated,
        'success'
      );

      showToast(`Lazy Mode daily rhythm generated!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate plan', 'error');
      onLogActivity(
        'plan_day',
        'Daily Planning Failed',
        `${chosenTasks.length} tasks`,
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

  const toggleBlockCompleted = (blockId: string) => {
    if (!currentPlan) return;
    const updatedBlocks = currentPlan.blocks.map((b) =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    );
    const updatedPlan = { ...currentPlan, blocks: updatedBlocks };
    setCurrentPlan(updatedPlan);
    onSavePlan(updatedPlan);
  };

  const formatTimerMinutes = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const pendingTasksList = tasks.filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold uppercase tracking-wider">
          <CalendarClock className="w-4 h-4" />
          <span>The Signature "Slow & Steady" Flow</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Lazy Mode — Daily Rhythm Planner
        </h2>
        <p className="text-sm text-slate-300">
          Sustainable scheduling. We reject toxic hustle: your plan balances high-focus sprints with restorative breaks and cognitive pacing.
        </p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preferences & Task Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-lime-400" />
              <span>Rhythm Configuration</span>
            </h3>

            {/* Energy Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Current Energy Level</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEnergyLevel('low')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    energyLevel === 'low'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-[#0b140f] border-[#1d3326] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Battery className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span className="text-[11px] block">Gentle (Low)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnergyLevel('medium')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    energyLevel === 'medium'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-[#0b140f] border-[#1d3326] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BatteryMedium className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span className="text-[11px] block">Balanced</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnergyLevel('high')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    energyLevel === 'high'
                      ? 'bg-lime-950/40 border-lime-400/50 text-lime-300 font-bold'
                      : 'bg-[#0b140f] border-[#1d3326] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4 mx-auto mb-1 text-lime-400" />
                  <span className="text-[11px] block">Sprint (High)</span>
                </button>
              </div>
            </div>

            {/* Work Hours Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">Available Focus Hours</span>
                <span className="text-lime-400 font-mono font-bold">{availableHours} hours</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full accent-lime-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2h (Relaxed)</span>
                <span>6h (Standard)</span>
                <span>10h (Maximum)</span>
              </div>
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Schedule Start Time</label>
              <input
                type="time"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>

            {/* Work Style */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Session Cadence</label>
              <select
                value={workStyle}
                onChange={(e) => setWorkStyle(e.target.value as WorkStyle)}
                className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
              >
                <option value="balanced">Balanced (35m work / 10m break)</option>
                <option value="pomodoro">Pomodoro (25m sprint / 5m break)</option>
                <option value="flow">Deep Flow (50m immersion / 15m break)</option>
              </select>
            </div>
          </div>

          {/* Task Selection Card */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Select Tasks ({selectedTaskIds.length} of {pendingTasksList.length})
              </h3>
              <button
                onClick={() =>
                  setSelectedTaskIds(
                    selectedTaskIds.length === pendingTasksList.length
                      ? []
                      : pendingTasksList.map((t) => t.id)
                  )
                }
                className="text-[11px] text-lime-400 hover:underline cursor-pointer"
              >
                {selectedTaskIds.length === pendingTasksList.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pendingTasksList.length > 0 ? (
                pendingTasksList.map((task) => {
                  const isChecked = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTaskSelection(task.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#13241b] border-lime-500/40 text-slate-100'
                          : 'bg-[#09110d] border-[#1a2d22] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                            isChecked
                              ? 'bg-lime-400 text-slate-950 font-bold'
                              : 'border border-slate-600'
                          }`}
                        >
                          {isChecked && '✓'}
                        </div>
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-black/30 border border-white/5 shrink-0 ml-2">
                        {task.priority}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No pending tasks. Add tasks via Quick Capture.
                </p>
              )}
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={loading || selectedTaskIds.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 glow-lime"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Calculating Cognitive Load...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generate Lazy Mode Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Schedule Timeline & Focus Timer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Session Pomodoro Timer Card */}
          {currentPlan && currentPlan.blocks.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0d1d15] to-[#0a1610] border border-[#213b2c] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">
                  Current Active Focus Block
                </span>
                <h4 className="text-sm font-bold text-white">
                  {currentPlan.blocks[activeBlockIndex]?.title || 'Session'}
                </h4>
                <p className="text-xs text-slate-300">
                  {currentPlan.blocks[activeBlockIndex]?.description}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-lime-400 tracking-wider">
                  {formatTimerMinutes(timerSecondsLeft)}
                </div>

                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`p-3 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                    timerRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-lime-500 text-slate-950 font-bold shadow-md shadow-lime-950/50'
                  }`}
                  title={timerRunning ? 'Pause timer' : 'Start focus timer'}
                >
                  {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Generated Schedule Timeline */}
          {currentPlan ? (
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              {/* Overview & Rationale */}
              <div className="border-b border-[#1b3124] pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Daily Rhythm Architecture</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {currentPlan.targetHours}h Plan • {currentPlan.energyLevel} Energy
                    </span>
                  </div>

                  {/* Low energy switch */}
                  <button
                    onClick={() => setShowLowEnergyDrawer(!showLowEnergyDrawer)}
                    className="text-xs text-amber-300 hover:text-amber-200 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Feeling tired? Low-Energy Plan</span>
                    {showLowEnergyDrawer ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b140f] p-3 rounded-xl border border-emerald-900/30">
                  {currentPlan.scheduleOverview}
                </p>

                <p className="text-[11px] text-slate-400 italic">
                  <strong>Pacing Rationale:</strong> {currentPlan.pacingRationale}
                </p>
              </div>

              {/* Low energy drawer */}
              {showLowEnergyDrawer && (
                <div className="p-4 bg-amber-950/20 border border-amber-600/30 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Gentle Alternative Routine (Low Cognitive Drain)</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {currentPlan.lowEnergyAlternative.summary}
                  </p>
                  {currentPlan.lowEnergyAlternative.blocksToDefer.length > 0 && (
                    <div className="text-xs text-amber-200">
                      <strong>Recommended items to defer:</strong>{' '}
                      {currentPlan.lowEnergyAlternative.blocksToDefer.join(', ')}
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Mindful Tips:
                    </span>
                    <ul className="text-xs text-amber-200/80 list-disc list-inside space-y-0.5 mt-1">
                      {currentPlan.lowEnergyAlternative.tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Timeline blocks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Timeline Flow ({currentPlan.blocks.length} Sessions)
                </h4>

                <div className="space-y-2.5">
                  {currentPlan.blocks.map((block, idx) => {
                    const isBreak = block.type === 'break';
                    const isSelectedTimer = idx === activeBlockIndex;

                    return (
                      <div
                        key={block.id}
                        onClick={() => handleSelectBlockForTimer(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelectedTimer
                            ? 'ring-2 ring-lime-400/50 bg-[#122319] border-emerald-500/40 shadow-md'
                            : isBreak
                            ? 'bg-[#0d1a13] border-emerald-800/30 hover:border-emerald-700/50'
                            : block.completed
                            ? 'bg-[#09110d] border-[#18281e] opacity-60'
                            : 'bg-[#0b1610] border-[#1c3325] hover:border-lime-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Checkmark or Break Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBlockCompleted(block.id);
                              }}
                              className="mt-0.5 text-slate-400 hover:text-lime-400 cursor-pointer"
                              title={block.completed ? 'Mark pending' : 'Mark completed'}
                            >
                              {block.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : isBreak ? (
                                <Coffee className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-500 hover:text-white" />
                              )}
                            </button>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs text-lime-400 font-semibold">
                                  {block.startTime} – {block.endTime}
                                </span>
                                <span
                                  className={`text-xs font-bold ${
                                    block.completed ? 'line-through text-slate-500' : 'text-white'
                                  }`}
                                >
                                  {block.title}
                                </span>
                                {isBreak && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Recovery Break
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed">
                                {block.description}
                              </p>

                              {block.pacingReason && (
                                <p className="text-[10px] text-slate-400 font-mono italic">
                                  Why: {block.pacingReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 border border-white/5">
                              {block.durationMinutes}m
                            </span>
                            {isSelectedTimer && (
                              <span className="text-[9px] text-lime-400 font-bold uppercase tracking-wider">
                                In Timer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#09110d] rounded-3xl border border-dashed border-[#1f372a]">
              <Sparkles className="w-10 h-10 text-lime-400/50 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">No active daily plan</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Configure your energy level and work hours on the left, select your tasks, and click "Generate Lazy Mode Schedule".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
