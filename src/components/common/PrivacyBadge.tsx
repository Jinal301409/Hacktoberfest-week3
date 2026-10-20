import React, { useState } from 'react';
import { ShieldCheck, Lock, ExternalLink, X } from 'lucide-react';

interface PrivacyBadgeProps {
  isLocal: boolean;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ isLocal }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 bg-[#0b1410] hover:bg-[#121f19] border border-emerald-900/40 hover:border-emerald-700/60 text-emerald-300 text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-sm"
        title="Privacy Architecture: Zero Data Leaves Your Machine in Local Mode"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium hidden sm:inline">
          {isLocal ? '100% On-Device' : 'Hosted Fallback'}
        </span>
        <span className="text-[10px] text-emerald-400/80 font-mono hidden md:inline">
          {isLocal ? 'Zero Telemetry' : 'SSL Encrypted'}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1713] border border-[#22392c] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Privacy Architecture</h3>
                <p className="text-xs text-slate-400">
                  Hacktoberfest 2026 Open-Source AI Principle
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-[#13201a] rounded-xl border border-emerald-800/30">
                <p className="font-semibold text-emerald-300 mb-1">
                  Local Ollama & Gemma Open-Weights:
                </p>
                <p className="text-slate-300">
                  When running Ollama locally (<code className="text-lime-300 font-mono">http://127.0.0.1:11434</code>), all notes, tasks, summaries, and files are processed strictly within your own computer's memory and GPU/CPU. <strong>Zero bytes leave your machine.</strong>
                </p>
              </div>

              <div className="p-3 bg-[#171b19] rounded-xl border border-slate-700/40">
                <p className="font-semibold text-slate-300 mb-1">
                  Offline Capabilities:
                </p>
                <p className="text-slate-400">
                  Initial model download requires an internet connection via <code className="text-slate-300 font-mono">ollama pull gemma2:2b</code>. Once downloaded, inference runs 100% offline without any internet connection.
                </p>
              </div>

              <div className="p-3 bg-[#1b1912] rounded-xl border border-amber-900/30">
                <p className="font-semibold text-amber-300 mb-1">
                  Simulated Demo Mode:
                </p>
                <p className="text-slate-400">
                  Runs in-process on your device for immediate testing without setting up Ollama. Clearly labeled so you are never misled.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#22392c] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
