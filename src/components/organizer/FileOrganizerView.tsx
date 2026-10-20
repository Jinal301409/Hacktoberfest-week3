import React, { useState, useRef } from 'react';
import {
  FolderGit2,
  Upload,
  Sparkles,
  Download,
  Terminal,
  FolderTree,
  FileCode,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../common/Toast.js';
import { AppSettings } from '../../types/index.js';
import { FileOrganizeResponse, FileSuggestion } from '../../../server/types.js';

interface FileOrganizerViewProps {
  settings: AppSettings;
  onLogActivity: (
    action: 'organize_files',
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

export const FileOrganizerView: React.FC<FileOrganizerViewProps> = ({
  settings,
  onLogActivity,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filenameText, setFilenameText] = useState(
    `IMG_202610_final_v2_FINAL(1).png\nnotes_dbms_sep2026_lecture4.txt\nInvoice_AcmeCorp_00392_OCT.pdf\nmeeting_recording_transcript_team_sync.txt\ntmp_scratchpad_hacktoberfest_ideas.md\nScreenshot_2026-10-18_at_11.45.22.png`
  );
  const [contextHint, setContextHint] = useState('Personal study, dev assets, and finances');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FileOrganizeResponse | null>(null);

  const presets = [
    {
      label: 'Messy Downloads',
      text: `IMG_202610_final_v2_FINAL(1).png\nnotes_dbms_sep2026_lecture4.txt\nInvoice_AcmeCorp_00392_OCT.pdf\nmeeting_recording_transcript_team_sync.txt\ntmp_scratchpad_hacktoberfest_ideas.md\nScreenshot_2026-10-18_at_11.45.22.png`,
    },
    {
      label: 'CS Academic Coursework',
      text: `assignment2_dbms_schema_submitted.txt\nlecture_notes_os_threads_oct12.md\nquiz3_study_guide_algorithms.txt\nlab_report_computer_networks_v3.pdf`,
    },
    {
      label: 'Software Repo Assets',
      text: `logo_dark_final_revised.svg\nconfig_dev_environment_sample.json\nbenchmark_results_ollama_gemma2.log\nchangelog_draft_v1.0.md`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const names = Array.from(files).map((f) => f.name);
    setFilenameText((prev) => (prev ? `${prev}\n${names.join('\n')}` : names.join('\n')));
    showToast(`Added ${names.length} filenames from file picker!`, 'success');
  };

  const handleOrganize = async () => {
    const lines = filenameText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showToast('Please enter at least 1 filename to organize', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.organizeFiles({
        files: lines.map((name) => ({ name })),
        contextHint,
        provider: settings.preferredProvider,
        model: settings.preferredProvider === 'ollama' ? settings.ollamaModel : undefined,
      });

      setResponse(res);

      onLogActivity(
        'organize_files',
        `Organized ${res.suggestions.length} files`,
        contextHint || 'Files',
        res.meta.provider,
        res.meta.model,
        res.meta.executionMs,
        res.meta.isSimulated,
        'success'
      );

      showToast(`Analyzed ${res.suggestions.length} files!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'File organization failed', 'error');
      onLogActivity(
        'organize_files',
        'Organization Failed',
        contextHint || 'Files',
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

  const downloadBashScript = () => {
    if (!response) return;
    let sh = `#!/usr/bin/env bash\n# LazyFlow AI Automated Rename & Organize Script\n# Generated on ${new Date().toISOString()}\n\necho "Organizing files according to LazyFlow AI plan..."\n\n`;

    // Make directories
    response.recommendedDirectoryTree.forEach((dir) => {
      sh += `mkdir -p "${dir}"\n`;
    });
    sh += `\n`;

    // Move commands
    response.suggestions.forEach((s) => {
      sh += `if [ -f "${s.originalName}" ]; then\n  mv "${s.originalName}" "${s.suggestedFolder}${s.suggestedName}"\n  echo "Renamed: ${s.originalName} -> ${s.suggestedFolder}${s.suggestedName}"\nfi\n`;
    });

    sh += `\necho "Finished organizing files!"\n`;

    const blob = new Blob([sh], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organize-files-${new Date().toISOString().slice(0, 10)}.sh`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded bash shell script (.sh)!', 'success');
  };

  const downloadWindowsBat = () => {
    if (!response) return;
    let bat = `@echo off\nREM LazyFlow AI Automated Rename & Organize Script (Windows)\nREM Generated on ${new Date().toISOString()}\n\necho Organizing files with LazyFlow AI...\n\n`;

    response.recommendedDirectoryTree.forEach((dir) => {
      bat += `if not exist "${dir.replace(/\//g, '\\')}" mkdir "${dir.replace(/\//g, '\\')}"\n`;
    });
    bat += `\n`;

    response.suggestions.forEach((s) => {
      const targetPath = `${s.suggestedFolder}${s.suggestedName}`.replace(/\//g, '\\');
      bat += `if exist "${s.originalName}" (\n  move "${s.originalName}" "${targetPath}"\n  echo Renamed: ${s.originalName} to ${targetPath}\n)\n`;
    });

    bat += `\necho Finished organizing files!\npause\n`;

    const blob = new Blob([bat], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organize-files-${new Date().toISOString().slice(0, 10)}.bat`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Windows batch script (.bat)!', 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
          <FolderGit2 className="w-4 h-4" />
          <span>Semantic Taxonomy & Hygiene</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          File & Folder Organizer
        </h2>
        <p className="text-sm text-slate-300">
          Clean messy filenames like <code className="text-lime-300 font-mono">IMG_final_v2(1).png</code> into clean ISO-8601 standardized names. Preview changes and export runnable local rename scripts.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        {/* Presets and file picker */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Try preset:</span>
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setFilenameText(p.text)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#14231b] hover:bg-[#1c3327] text-slate-300 hover:text-teal-300 border border-[#213a2d] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-300 hover:text-white border border-[#274734] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              <span>Select Local Files</span>
            </button>
          </div>
        </div>

        {/* Filenames Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Filenames to Standardize (one per line)
          </label>
          <textarea
            value={filenameText}
            onChange={(e) => setFilenameText(e.target.value)}
            rows={6}
            placeholder="e.g. IMG_2026_final.png"
            className="w-full bg-[#08100c] border border-[#1f382a] rounded-2xl p-3 text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed resize-y"
          />
        </div>

        {/* Context Hint */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Context or Domain Hint (optional)
            </label>
            <input
              type="text"
              value={contextHint}
              onChange={(e) => setContextHint(e.target.value)}
              placeholder="e.g. University lectures, freelance invoices, UI design assets"
              className="w-full bg-[#08100c] border border-[#1f382a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end pt-5 sm:pt-4">
            <button
              onClick={handleOrganize}
              disabled={loading || !filenameText.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 glow-lime"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Taxonomy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generate Organization Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security Disclaimer Notice */}
      <div className="p-4 bg-[#0d1612] border border-teal-900/30 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-teal-300">Browser Security & Transparency:</p>
          <p className="text-slate-400 leading-relaxed">
            Due to web browser sandbox constraints, web apps cannot silently rename or move files on your hard drive. LazyFlow AI provides clear side-by-side previews and downloadable one-click terminal scripts (<code className="text-slate-300 font-mono">.sh</code> / <code className="text-slate-300 font-mono">.bat</code>) so you maintain full control of your local filesystem.
          </p>
        </div>
      </div>

      {/* Organization Preview Table */}
      {response && (
        <div className="glass-panel p-6 rounded-3xl space-y-6 animate-in fade-in duration-300 border-teal-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b3125] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                AI Organization Plan
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Suggested Standardized Taxonomy ({response.suggestions.length} items)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{response.summary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={downloadBashScript}
                className="px-3.5 py-2 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-200 border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download bash script for Mac and Linux"
              >
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                <span>Download .sh</span>
              </button>

              <button
                onClick={downloadWindowsBat}
                className="px-3.5 py-2 rounded-xl bg-[#14261c] hover:bg-[#1a3325] text-slate-200 border border-[#274734] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download batch script for Windows"
              >
                <FileCode className="w-3.5 h-3.5 text-lime-400" />
                <span>Download .bat</span>
              </button>
            </div>
          </div>

          {/* Directory Tree Suggestion */}
          {response.recommendedDirectoryTree.length > 0 && (
            <div className="p-4 bg-[#09110d] rounded-2xl border border-[#1b2f23] space-y-2">
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Recommended Directory Structure</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {response.recommendedDirectoryTree.map((dir, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#112017] text-slate-200 border border-teal-800/30 flex items-center gap-1.5"
                  >
                    <span>📁</span>
                    <span>{dir}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1b3125] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-2">Original Filename</th>
                  <th className="pb-3 px-2">Suggested Clean Name</th>
                  <th className="pb-3 px-2">Folder / Taxonomy</th>
                  <th className="pb-3 px-2">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15271e]">
                {response.suggestions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 font-mono text-slate-400 max-w-xs truncate">
                      {item.originalName}
                    </td>
                    <td className="py-3 px-2 font-mono text-lime-300 font-semibold max-w-xs truncate">
                      {item.suggestedName}
                    </td>
                    <td className="py-3 px-2 text-slate-300 font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#13241b] text-teal-300 border border-teal-800/30">
                        {item.suggestedFolder}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400 text-[11px] leading-snug">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
