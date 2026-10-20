import React from 'react';
import { Menu, Sparkles, Trash2, Leaf } from 'lucide-react';
import { ConnectionStatus } from '../../types/index.js';
import { ModelBadge } from '../common/ModelBadge.js';
import { PrivacyBadge } from '../common/PrivacyBadge.js';

interface NavbarProps {
  currentTab: string;
  connectionStatus: ConnectionStatus | null;
  statusLoading: boolean;
  isSampleData: boolean;
  onRefreshStatus: () => void;
  onNavigate: (tab: string) => void;
  onClearSampleData: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  connectionStatus,
  statusLoading,
  isSampleData,
  onRefreshStatus,
  onNavigate,
  onClearSampleData,
  onToggleMobileSidebar,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Productivity Command';
      case 'quick-capture':
        return 'Quick Brain Dump & Capture';
      case 'summarizer':
        return 'Smart Document Summarizer';
      case 'tasks':
        return 'Structured Task Extractor';
      case 'planner':
        return 'Lazy Mode Daily Planner';
      case 'organizer':
        return 'Clean File Organizer';
      case 'activity':
        return 'Open-Source AI Activity';
      case 'settings':
        return 'Ollama & Provider Settings';
      default:
        return 'LazyFlow AI';
    }
  };

  const isLocal = connectionStatus?.provider !== 'gemini';

  return (
    <header className="sticky top-0 z-30 bg-[#070d0a]/85 backdrop-blur-md border-b border-[#1b2b22] px-4 lg:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg lg:hidden hover:bg-white/5 transition-colors"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {getTabTitle(currentTab)}
              </h1>
              {isSampleData && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Sample Data
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              "You relax. Your AI handles the boring stuff."
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isSampleData && (
            <button
              onClick={onClearSampleData}
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 px-2.5 py-1 rounded-lg border border-transparent hover:border-rose-900/40 hover:bg-rose-950/20 transition-all cursor-pointer"
              title="Clear preloaded sample tasks and activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sample Data</span>
            </button>
          )}

          <PrivacyBadge isLocal={isLocal} />

          <ModelBadge
            status={connectionStatus}
            loading={statusLoading}
            onRefresh={onRefreshStatus}
            onClickSettings={() => onNavigate('settings')}
          />

          {currentTab !== 'planner' && (
            <button
              onClick={() => onNavigate('planner')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow-lime-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer glow-lime"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="font-bold">Lazy Mode</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
