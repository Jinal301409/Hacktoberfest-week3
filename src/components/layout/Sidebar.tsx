import React from 'react';
import {
  LayoutDashboard,
  Zap,
  FileText,
  CheckSquare,
  CalendarClock,
  FolderGit2,
  Activity,
  Settings,
  X,
  HeartHandshake,
  ShieldCheck,
  Leaf
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  pendingTasksCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  pendingTasksCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quick-capture', label: 'Quick Capture', icon: Zap, badge: 'AI Dump' },
    { id: 'summarizer', label: 'Smart Summarizer', icon: FileText },
    {
      id: 'tasks',
      label: 'Task Extractor',
      icon: CheckSquare,
      count: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    { id: 'planner', label: 'Daily Planner', icon: CalendarClock, highlight: true },
    { id: 'organizer', label: 'File Organizer', icon: FolderGit2 },
    { id: 'activity', label: 'AI Activity', icon: Activity },
    { id: 'settings', label: 'Settings & Ollama', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#09100c] border-r border-[#192b21] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#17271e] flex items-center justify-between">
          <button
            onClick={() => {
              onNavigate('dashboard');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 p-0.5 shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#09110d] rounded-[14px] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-lime-400 group-hover:text-emerald-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-lime-300 transition-colors">
                  LazyFlow
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-lime-400/20 text-lime-300 border border-lime-400/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Open-Source Assistant</p>
            </div>
          </button>

          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#15271d] text-lime-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f1b14] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-lime-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.highlight && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Lazy Mode
                    </span>
                  )}
                  {item.badge && !item.highlight && (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30">
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Hacktoberfest & Open Source Footer */}
        <div className="p-3 m-3 bg-[#0d1813] border border-[#1e3428] rounded-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-200">
              Hacktoberfest 2026
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
            DEV Open-Source AI Challenge. Week 3: <em className="text-lime-300 not-italic font-semibold">"Slow and Steady"</em>.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Gemma 2 Open-Weights</span>
          </div>
        </div>
      </aside>
    </>
  );
};
