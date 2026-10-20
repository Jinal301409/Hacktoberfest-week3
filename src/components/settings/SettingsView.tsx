import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  HardDrive,
  Trash2,
  ExternalLink,
  Laptop,
  Server
} from 'lucide-react';
import { AppSettings, ConnectionStatus } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';

interface SettingsViewProps {
  settings: AppSettings;
  connectionStatus: ConnectionStatus | null;
  statusLoading: boolean;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshStatus: () => void;
  onClearAllData: () => void;
  onResetSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  connectionStatus,
  statusLoading,
  onUpdateSettings,
  onRefreshStatus,
  onClearAllData,
  onResetSampleData,
}) => {
  const { showToast } = useToast();

  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaBaseUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleTestOllama = async () => {
    setTestingConnection(true);
    try {
      const res = await api.testConnection(ollamaUrl, ollamaModel);
      onRefreshStatus();
      if (res.connected) {
        showToast(`Connected to Ollama! Latency: ${res.latencyMs}ms`, 'success');
      } else {
        showToast(res.error || 'Ollama connection failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Connection test failed', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = () => {
    onUpdateSettings({
      ollamaBaseUrl: ollamaUrl,
      ollamaModel: ollamaModel,
    });
    showToast('Saved AI configuration', 'success');
  };

  const copyToClipboard = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    showToast('Command copied to clipboard!', 'success');
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>Open-Source AI & Hardware Control</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          AI Settings & Local Ollama Setup
        </h2>
        <p className="text-sm text-slate-300">
          Configure your local Gemma open-weight inference engine. Manage privacy settings, connectivity, and offline capabilities.
        </p>
      </div>

      {/* Provider Selector Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-lime-400" />
          <span>Active AI Engine</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Ollama Local */}
          <div
            onClick={() => onUpdateSettings({ preferredProvider: 'ollama' })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              settings.preferredProvider === 'ollama'
                ? 'bg-[#13271c] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-[#0a140f] border-[#1d3326] hover:border-emerald-600/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Local Ollama</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Open-Source
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Runs real Gemma 2 weights locally on your GPU/CPU via Ollama daemon.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero data leaves device</span>
            </div>
          </div>

          {/* Simulated Gemma Demo */}
          <div
            onClick={() => onUpdateSettings({ preferredProvider: 'simulated' })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              settings.preferredProvider === 'simulated'
                ? 'bg-[#1b2216] border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                : 'bg-[#0a140f] border-[#1d3326] hover:border-amber-600/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Simulated Gemma</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Demo Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              In-process heuristic simulator for instant test runs without installing Ollama.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
              <Laptop className="w-3.5 h-3.5" />
              <span>Visibly tagged demo</span>
            </div>
          </div>

          {/* Gemini Hosted Fallback */}
          <div
            onClick={() => onUpdateSettings({ preferredProvider: 'gemini' })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              settings.preferredProvider === 'gemini'
                ? 'bg-[#111f26] border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                : 'bg-[#0a140f] border-[#1d3326] hover:border-sky-600/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Gemini API</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Non-Open Fallback
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Optional remote Google API fallback. Clearly labeled as non-open-weight.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-sky-400 font-medium">
              <Server className="w-3.5 h-3.5" />
              <span>Requires GEMINI_API_KEY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ollama Daemon Connection Settings */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f3729] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Local Ollama Configuration</h3>
            <p className="text-xs text-slate-400">
              Customize endpoint URL and Gemma open-weight tag.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestOllama}
              disabled={testingConnection}
              className="px-3.5 py-1.5 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-200 border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-lime-400 ${
                  testingConnection ? 'animate-spin' : ''
                }`}
              />
              <span>Test Connection</span>
            </button>

            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        {/* Live Status Banner */}
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
            connectionStatus?.connected && connectionStatus?.provider === 'ollama'
              ? 'bg-[#0f2418] border-emerald-500/40 text-emerald-200'
              : 'bg-[#1c1810] border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {connectionStatus?.connected && connectionStatus?.provider === 'ollama' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-bold text-white">
                {connectionStatus?.connected && connectionStatus?.provider === 'ollama'
                  ? `Ollama Daemon Online (${connectionStatus.latencyMs}ms)`
                  : 'Ollama Daemon Not Detected at configured URL'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {connectionStatus?.connected && connectionStatus?.provider === 'ollama'
                  ? `Ready for zero-latency local inference. Installed models: ${
                      connectionStatus.availableModels.join(', ') || 'none'
                    }`
                  : `Currently running in Simulated Demo mode. Run 'ollama run gemma2:2b' locally to connect.`}
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ollama Base URL
            </label>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default: http://127.0.0.1:11434</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Gemma Model
            </label>
            <select
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-lime-500"
            >
              <option value="gemma2:2b">gemma2:2b (Recommended, fast & lightweight ~1.6GB)</option>
              <option value="gemma2:9b">gemma2:9b (Higher reasoning, ~5.4GB)</option>
              <option value="gemma:7b">gemma:7b (Original Gemma)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Open-weight release by Google DeepMind</p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guides */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-lime-400" />
          <span>How to Install & Run Gemma with Ollama</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* macOS / Linux */}
          <div className="p-4 bg-[#09110d] rounded-2xl border border-[#1c3326] space-y-2">
            <h4 className="font-bold text-lime-300">macOS & Linux</h4>
            <p className="text-slate-400 text-[11px]">Install Ollama via the official shell script:</p>
            <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl font-mono text-[11px] text-slate-200 border border-white/5">
              <span className="truncate">curl -fsSL https://ollama.com/install.sh | sh</span>
              <button
                onClick={() => copyToClipboard('curl -fsSL https://ollama.com/install.sh | sh', 'sh')}
                className="text-slate-400 hover:text-white p-1"
              >
                {copiedCmd === 'sh' ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-slate-400 text-[11px] pt-1">Then download and run the Gemma model:</p>
            <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl font-mono text-[11px] text-slate-200 border border-white/5">
              <span>ollama run gemma2:2b</span>
              <button
                onClick={() => copyToClipboard('ollama run gemma2:2b', 'run')}
                className="text-slate-400 hover:text-white p-1"
              >
                {copiedCmd === 'run' ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Windows / Docker */}
          <div className="p-4 bg-[#09110d] rounded-2xl border border-[#1c3326] space-y-2">
            <h4 className="font-bold text-teal-300">Windows & Docker</h4>
            <p className="text-slate-400 text-[11px]">
              Download the official Windows installer from{' '}
              <a
                href="https://ollama.com/download"
                target="_blank"
                rel="noreferrer"
                className="text-teal-300 underline inline-flex items-center gap-0.5"
              >
                ollama.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>

            <p className="text-slate-400 text-[11px] pt-1">Or launch via Docker container:</p>
            <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl font-mono text-[11px] text-slate-200 border border-white/5">
              <span className="truncate">docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    'docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama',
                    'docker'
                  )
                }
                className="text-slate-400 hover:text-white p-1"
              >
                {copiedCmd === 'docker' ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Privacy Matrix */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Data Privacy & Telemetry Matrix</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1b3125] text-slate-400 uppercase text-[10px]">
                <th className="pb-3 px-2">Configuration</th>
                <th className="pb-3 px-2">Data Destination</th>
                <th className="pb-3 px-2">Internet Required?</th>
                <th className="pb-3 px-2">Open-Source?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15271e]">
              <tr>
                <td className="py-3 px-2 font-bold text-white">Local Ollama (Gemma 2)</td>
                <td className="py-3 px-2 text-emerald-300 font-semibold">100% On-Device (0 bytes egress)</td>
                <td className="py-3 px-2 text-slate-300">Only for initial download; then 100% offline</td>
                <td className="py-3 px-2 text-emerald-400 font-bold">Yes (Open-Weights)</td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-bold text-white">Simulated Gemma (Demo)</td>
                <td className="py-3 px-2 text-amber-300">Local Browser / Node memory</td>
                <td className="py-3 px-2 text-slate-300">No (100% offline)</td>
                <td className="py-3 px-2 text-slate-400">In-Process Code</td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-bold text-white">Gemini API (Fallback)</td>
                <td className="py-3 px-2 text-sky-300">Google Cloud API</td>
                <td className="py-3 px-2 text-slate-300">Yes (Active connection)</td>
                <td className="py-3 px-2 text-slate-400">No (Proprietary cloud API)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Local Data Storage Management */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-rose-400" />
          <span>Data Management & Reset</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          LazyFlow AI stores your tasks, daily plans, and activity history in your browser's persistent local storage. You can reset to initial Hacktoberfest sample data or wipe all data cleanly at any time.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={onResetSampleData}
            className="px-4 py-2 bg-[#14261c] hover:bg-[#1a3325] text-lime-300 rounded-xl text-xs font-semibold border border-[#274734] transition-colors cursor-pointer"
          >
            Reset to Sample Data
          </button>

          <button
            onClick={onClearAllData}
            className="px-4 py-2 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 rounded-xl text-xs font-semibold border border-rose-800/30 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All Local Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
