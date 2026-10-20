import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Copy,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  ListOrdered,
  ListChecks,
  Smile,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';
import { SummaryMode, AppSettings } from '../../types/index.js';
import { SummarizeResponse } from '../../../server/types.js';

interface SummarizerViewProps {
  settings: AppSettings;
  onLogActivity: (
    action: 'summarize',
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

export const SummarizerView: React.FC<SummarizerViewProps> = ({
  settings,
  onLogActivity,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState<string>(
    `Hacktoberfest 2026 Week 3 Challenge: "Slow and Steady".\n\nModern work cultures often glorify frenetic multi-tasking, context switching, and endless notification churn. However, research into cognitive ergonomics consistently shows that sustained, rhythmic focus combined with intentional recovery windows yields higher quality engineering outcomes with significantly reduced burnout.\n\nOpen-source AI plays a pivotal role in this paradigm shift: by executing models like Gemma 2 directly on local hardware via Ollama, developers preserve data privacy, eliminate SaaS latency and unpredictable API rate limits, and gain sovereignty over their personal cognitive tools. By offloading monotonous transcription, categorization, and scheduling chores to local weights, developers preserve their mental bandwidth for deep creative problem solving.`
  );
  const [fileName, setFileName] = useState<string | null>('hacktoberfest_slow_steady_memo.md');
  const [selectedMode, setSelectedMode] = useState<SummaryMode>('detailed');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const modes: Array<{
    id: SummaryMode;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      id: 'quick',
      label: 'Quick Summary',
      description: '1-2 punchy sentences capturing the core bottom line',
      icon: Sparkles,
    },
    {
      id: 'detailed',
      label: 'Detailed Summary',
      description: 'Comprehensive narrative synthesis with key context',
      icon: BookOpen,
    },
    {
      id: 'key_points',
      label: 'Key Points',
      description: 'Structured bullet points of core insights',
      icon: ListOrdered,
    },
    {
      id: 'action_items',
      label: 'Action Items',
      description: 'Extracted next steps and actionable implementation items',
      icon: ListChecks,
    },
    {
      id: 'simple',
      label: 'Explain in Simple Terms',
      description: 'Plain-English analogies with zero jargon',
      icon: Smile,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported text formats
    const allowedExtensions = ['.txt', '.md', '.json', '.csv', '.log', '.html'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setFileError(
        `Unsupported file type '${ext}'. Only text-based formats (${allowedExtensions.join(
          ', '
        )}) are safely supported for privacy-first local processing.`
      );
      showToast(`Unsupported file: ${file.name}`, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError(
        `File '${file.name}' is too large (${(file.size / (1024 * 1024)).toFixed(
          1
        )} MB). Maximum allowed size is 2 MB to prevent browser memory exhaustion.`
      );
      showToast('File too large (max 2 MB)', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content || !content.trim()) {
        setFileError(`File '${file.name}' appears to be empty.`);
        return;
      }
      setText(content);
      setFileName(file.name);
      showToast(`Loaded ${file.name} (${content.length} chars)`, 'success');
    };
    reader.onerror = () => {
      setFileError(`Failed to read file '${file.name}'.`);
    };
    reader.readAsText(file);
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      showToast('Please enter text or upload a document to summarize', 'error');
      return;
    }

    setLoading(true);
    setFileError(null);

    try {
      const res = await api.summarize({
        text,
        mode: selectedMode,
        fileName: fileName || undefined,
        provider: settings.preferredProvider,
        model: settings.preferredProvider === 'ollama' ? settings.ollamaModel : undefined,
      });

      setResult(res);

      onLogActivity(
        'summarize',
        `Summarized (${selectedMode})`,
        fileName || text.slice(0, 50),
        res.meta.provider,
        res.meta.model,
        res.meta.executionMs,
        res.meta.isSimulated,
        'success'
      );

      showToast(`Summary generated (${res.readingTimeMinutes}m read)`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Summarization failed', 'error');
      onLogActivity(
        'summarize',
        'Summarization Failed',
        fileName || text.slice(0, 50),
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

  const handleCopy = () => {
    if (!result) return;
    const fullContent = `# ${result.headline}\n\n${result.summary}\n\n${
      result.keyPoints?.length
        ? `## Key Points\n${result.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
        : ''
    }${
      result.actionItems?.length
        ? `## Action Items\n${result.actionItems.map((a) => `- [ ] ${a}`).join('\n')}`
        : ''
    }`;

    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    showToast('Summary copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const fullContent = `# ${result.headline}\n\nMode: ${result.mode}\nDate: ${new Date().toLocaleDateString()}\nAI Provider: ${
      result.meta.provider
    } (${result.meta.model})\n\n---\n\n${result.summary}\n\n${
      result.keyPoints?.length
        ? `## Key Points\n${result.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
        : ''
    }${
      result.actionItems?.length
        ? `## Action Items\n${result.actionItems.map((a) => `- [ ] ${a}`).join('\n')}`
        : ''
    }`;

    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'doc'}-${result.mode}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Markdown file', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Distill & Synthesize</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Smart Summarizer
        </h2>
        <p className="text-sm text-slate-300">
          Paste text or upload supported documents (.md, .txt, .json, .csv). Select from 5 tailored summary modes for the exact depth you need.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#15271d] border-emerald-500/40 text-lime-300 shadow-md'
                  : 'bg-[#0c1611] border-[#1d3326] text-slate-400 hover:text-slate-200 hover:bg-[#112019]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${isSelected ? 'text-lime-400' : 'text-slate-400'}`}
                />
                <span className="text-xs font-bold leading-none">{mode.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Document Source:</span>
            {fileName ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14261c] border border-emerald-800/40 text-emerald-300 text-xs font-mono">
                <FileText className="w-3.5 h-3.5" />
                <span>{fileName}</span>
                <button
                  onClick={() => {
                    setFileName(null);
                    setText('');
                  }}
                  className="text-slate-400 hover:text-rose-400 ml-1"
                >
                  ×
                </button>
              </span>
            ) : (
              <span className="text-xs text-slate-500">Pasted text</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv,.log,.html"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-300 hover:text-white border border-[#274734] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-lime-400" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Error notification for unsupported files */}
        {fileError && (
          <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder="Paste or write notes, transcripts, or articles here..."
          className="w-full bg-[#080f0b] border border-[#203629] focus:border-emerald-500 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans leading-relaxed resize-y"
        />

        {/* Footer info & Run button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="text-xs text-slate-400 font-mono">
            {text.trim().split(/\s+/).filter(Boolean).length} words • ~
            {Math.max(1, Math.round(text.length / 1000))} min read
          </span>

          <button
            onClick={handleSummarize}
            disabled={loading || !text.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed glow-lime shrink-0"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Distilling with Gemma...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Summary Card */}
      {result && (
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-in fade-in duration-300 border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f3729] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-lime-500/20 text-lime-300 border border-lime-500/30">
                  {result.mode}
                </span>
                <span className="text-xs text-slate-400">
                  {result.wordCount} words analyzed • ~{result.readingTimeMinutes} min read
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5">{result.headline}</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-300 hover:text-white border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy markdown to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-lime-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-300 hover:text-white border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download as Markdown file"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export .md</span>
              </button>
            </div>
          </div>

          {/* Narrative Summary */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap">
            {result.summary}
          </div>

          {/* Key Points Section */}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <div className="p-4 bg-[#0a120e] rounded-2xl border border-[#1b2f23] space-y-2">
              <h4 className="text-xs font-bold text-lime-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Key Takeaways</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items Section */}
          {result.actionItems && result.actionItems.length > 0 && (
            <div className="p-4 bg-[#0a120e] rounded-2xl border border-[#1b2f23] space-y-2">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Next Action Steps</span>
              </h4>
              <div className="space-y-1.5">
                {result.actionItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 text-xs text-slate-200 p-2 rounded-lg bg-white/5 border border-white/5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Attribution Footer */}
          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-[#1a2e22]">
            <span>
              Engine: <strong className="text-slate-400">{result.meta.provider}</strong> (
              {result.meta.model})
            </span>
            <span>Latency: {result.meta.executionMs}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};
