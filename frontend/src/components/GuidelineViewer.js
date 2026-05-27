import React, { useState } from 'react';
import { guidelineAPI } from '../utils/api';

// ── Inline icon ──────────────────────────────────────────────────────────────────
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  download:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  check:      'M20 6L9 17l-5-5',
  alert:      'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  close:      'M18 6 6 18M6 6l12 12',
  chevronDown:'M6 9l6 6 6-6',
  chevronUp:  'M18 15l-6-6-6 6',
  code:       'M16 18l6-6-6-6M8 6l-6 6 6 6',
  spark:      'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
};

function SeverityBadge({ severity }) {
  const cfg = {
    high:   { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    low:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  };
  const c = cfg[severity] || cfg.low;
  return (
    <span className="text-xs font-body px-2 py-0.5 rounded-full capitalize font-medium"
          style={{ color: c.color, background: c.bg }}>
      {severity}
    </span>
  );
}

function IssueCard({ issue, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card p-4 transition-all duration-200">
      <button
        className="w-full flex items-start justify-between gap-3 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-black mt-0.5"
            style={{
              background: issue.severity === 'high' ? '#f87171'
                        : issue.severity === 'medium' ? '#fbbf24' : '#38bdf8'
            }}
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-white/90 leading-tight mb-1">{issue.title}</p>
            <div className="flex flex-wrap gap-1.5">
              <SeverityBadge severity={issue.severity} />
              <span className="text-xs font-body px-2 py-0.5 rounded-full text-white/40"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                {issue.category?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <span className="text-white/30 flex-shrink-0 mt-1">
          <Icon d={expanded ? ICONS.chevronUp : ICONS.chevronDown} size={14} />
        </span>
      </button>

      {expanded && (
        <div className="mt-3 pl-9 space-y-3 border-t border-white/10 pt-3">
          <p className="text-xs font-body text-white/60 leading-relaxed">{issue.description}</p>

          {issue.fixImplementation && (
            <div>
              <p className="text-xs font-body text-white/35 uppercase tracking-widest mb-1.5">
                Fix Implementation
              </p>
              <p className="text-xs font-body text-white/70 leading-relaxed">{issue.fixImplementation}</p>
            </div>
          )}

          {issue.codeSnippet && (
            <div>
              <p className="text-xs font-body text-white/35 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Icon d={ICONS.code} size={10} /> Code Snippet
              </p>
              <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto leading-relaxed"
                   style={{ background: 'rgba(255,255,255,0.05)', color: '#a8ff78' }}>
                {issue.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase }) {
  const phaseColors = ['#10a37f', '#0ea5e9', '#a855f7'];
  const color = phaseColors[(phase.phase - 1) % phaseColors.length];
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-heading font-bold"
           style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
        {phase.phase}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-white/90 font-medium">{phase.label}</p>
        <p className="text-xs font-body text-white/40">
          {phase.issues?.length || 0} issue{phase.issues?.length !== 1 ? 's' : ''} · {phase.timeEstimate}
        </p>
      </div>
    </div>
  );
}

/**
 * GuidelineViewer
 * Props:
 *  - guideline  – the generated guidelines object
 *  - guidelineId – MongoDB _id for PDF download
 *  - frontendStack, stylingLibrary – for display
 *  - onClose()
 */
export default function GuidelineViewer({
  guideline,
  guidelineId,
  frontendStack,
  stylingLibrary,
  onClose
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const handleDownloadPDF = async () => {
    if (!guidelineId) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await guidelineAPI.downloadGuidelinePDF(guidelineId);
      const url  = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `guideline-${frontendStack}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!guideline) return null;

  const sortedIssues = [...(guideline.issueBreakdown || [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)' }}
    >
      <div className="glass-panel-strong w-full max-w-3xl p-0 overflow-hidden animate-fade-in mb-8">
        {/* Header */}
        <div className="px-7 py-5 border-b border-white/10 flex items-start justify-between"
             style={{ background: 'rgba(16,163,127,0.08)' }}>
          <div>
            <h2 className="font-heading italic text-white text-2xl leading-none mb-1">
              Fixing Guidelines
            </h2>
            <p className="text-xs font-body text-white/40">
              {frontendStack} · {stylingLibrary} · {sortedIssues.length} issue{sortedIssues.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="guideline-download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={downloading || !guidelineId}
              className="glass-btn px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40"
              style={{ borderRadius: '9999px' }}
            >
              <Icon d={ICONS.download} size={12} />
              {downloading ? 'Downloading…' : 'Export PDF'}
            </button>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1.5">
              <Icon d={ICONS.close} size={18} />
            </button>
          </div>
        </div>

        <div className="p-7 space-y-7">
          {/* Download error */}
          {downloadError && (
            <div className="glass-card p-3 text-xs font-body text-[#f87171] flex items-center gap-2"
                 style={{ borderColor: 'rgba(248,113,113,0.25)' }}>
              <Icon d={ICONS.alert} size={12} />
              {downloadError}
            </div>
          )}

          {/* Executive Summary */}
          {guideline.executiveSummary && (
            <section>
              <h3 className="text-xs font-body text-white/35 uppercase tracking-widest mb-3">
                Executive Summary
              </h3>
              <div className="glass-card p-5">
                <p className="text-sm font-body text-white/75 leading-relaxed">
                  {guideline.executiveSummary}
                </p>
              </div>
            </section>
          )}

          {/* Priority Roadmap */}
          {(guideline.priorityRoadmap || []).length > 0 && (
            <section>
              <h3 className="text-xs font-body text-white/35 uppercase tracking-widest mb-3">
                Priority Roadmap
              </h3>
              <div className="space-y-2.5">
                {guideline.priorityRoadmap.map(phase => (
                  <PhaseCard key={phase.phase} phase={phase} />
                ))}
              </div>
            </section>
          )}

          {/* Issue Breakdown */}
          {sortedIssues.length > 0 && (
            <section>
              <h3 className="text-xs font-body text-white/35 uppercase tracking-widest mb-3">
                Issue Breakdown ({sortedIssues.length})
              </h3>
              <div className="space-y-2.5">
                {sortedIssues.map((issue, i) => (
                  <IssueCard key={issue.issueId || i} issue={issue} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Accessibility Fixes */}
          {(guideline.accessibilityFixes || []).length > 0 && (
            <section>
              <h3 className="text-xs font-body text-white/35 uppercase tracking-widest mb-3">
                Accessibility Fixes (WCAG)
              </h3>
              <div className="glass-card p-5 space-y-2">
                {guideline.accessibilityFixes.map((fix, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#10a37f] mt-0.5 flex-shrink-0"><Icon d={ICONS.check} size={12} /></span>
                    <p className="text-sm font-body text-white/70 leading-relaxed">{fix}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Technical Recommendations */}
          {(guideline.technicalRecommendations || []).length > 0 && (
            <section>
              <h3 className="text-xs font-body text-white/35 uppercase tracking-widest mb-3">
                Technical Recommendations
              </h3>
              <div className="glass-card p-5 space-y-2">
                {guideline.technicalRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#0ea5e9] mt-0.5 flex-shrink-0"><Icon d={ICONS.code} size={12} /></span>
                    <p className="text-sm font-body text-white/70 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
