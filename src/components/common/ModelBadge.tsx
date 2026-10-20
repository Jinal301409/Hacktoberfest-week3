import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '../../types/index.js';

interface ModelBadgeProps {
  status: ConnectionStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onClickSettings: () => void;
}

export const ModelBadge: React.FC<ModelBadgeProps> = ({
  status,
  loading,
  onRefresh,
  onClickSettings,
}) => {
  const isOllamaConnected = status?.connected && status?.provider === 'ollama';
  const isSimulated = status?.provider === 'simulated' || !status?.connected;
  const isGemini = status?.provider === 'gemini';

  return (
    <div className="flex items-center gap-1.5 bg-[#0e1813] border border-[#23382c] rounded-full px-2.5 py-1 text-xs shadow-sm">
      <button
        onClick={onClickSettings}
        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer group"
        title="Click to view AI Provider & Model configuration"
      >
        <span className="relative flex h-2 w-2">
          {isOllamaConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : isGemini ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          )}
        </span>

        <Cpu className="w-3.5 h-3.5 text-lime-400 group-hover:scale-110 transition-transform" />

        <span className="font-medium text-slate-200">
          {isOllamaConnected ? (
            <>
              <span className="text-emerald-400 font-semibold">Ollama</span>
              <span className="text-slate-400 font-mono text-[11px] ml-1">
                {status?.model || 'gemma2:2b'}
              </span>
            </>
          ) : isGemini ? (
            <>
              <span className="text-sky-400 font-semibold">Gemini</span>
              <span className="text-slate-400 font-mono text-[11px] ml-1">
                {status?.model || '2.5-flash'}
              </span>
            </>
          ) : (
            <>
              <span className="text-amber-400 font-semibold">Simulated Gemma</span>
              <span className="text-slate-400 text-[11px] ml-1">(Demo Mode)</span>
            </>
          )}
        </span>

        {status?.latencyMs !== null && status?.latencyMs !== undefined && (
          <span className="text-[10px] font-mono text-slate-500 border-l border-slate-700/60 pl-1.5">
            {status.latencyMs}ms
          </span>
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRefresh();
        }}
        disabled={loading}
        title="Ping Ollama local endpoint"
        className="text-slate-400 hover:text-lime-400 p-0.5 rounded transition-colors disabled:opacity-40"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-lime-400' : ''}`} />
      </button>
    </div>
  );
};
